const puppeteer = require('puppeteer');
const Promise = require('bluebird');
const hb = require('handlebars');
const inlineCss = require('inline-css');

/*
 * Function to generate a PDF from a single file
 */
//module.exports  // moved at end

async function generatePdf(file, options, callback) {
  try {
     // we are using headless mode
    const args = options.args ||  ['--no-sandbox', '--disable-setuid-sandbox'];
    delete options.args;

    const browser = await puppeteer.launch({ args });
    const page = await browser.newPage();

    if(file.content) {
      data = await inlineCss(file.content, { url: "/" });
      console.log("Compiling the template with handlebars");
      
      // we have compile our code with handlebars
      const template = hb.compile(data, { strict: true });
      const html = template(data);

      // We set the page content as the generated html by handlebars
      await page.setContent(html, { waitUntil: 'networkidle0' }); // wait for page to load completely
    } else {
      await page.goto(file.url, { waitUntil:[ 'load', 'networkidle0'] }); // wait for page to load completely
    }

    const pdfBuffer = await page.pdf(options);
    await browser.close();

    callback(null, Buffer.from(Object.values(pdfBuffer)));
  } catch (error) {
    callback(error);
  }
}

/*
 * Function to generate PDFs from multiple files
 */
async function generatePdfs(files, options, callback) {
  try {
    // we are using headless mode
    const args = options.args ||  ['--no-sandbox', '--disable-setuid-sandbox'];
    delete options.args;

    const browser = await puppeteer.launch({ args });
    const page = await browser.newPage();
    const pdfs = [];
     
    for (let file of files) {
      if(file.content) {
        const data = await inlineCss(file.content, { url: "/" });
        console.log("Compiling the template with handlebars");
        
        // we have compile our code with handlebars
        const template = hb.compile(data, { strict: true });
        const html = template(data);
        
        // We set the page content as the generated html by handlebars
        await page.setContent(html, { waitUntil: 'networkidle0' }); // wait for page to load completely
      } else {
        await page.goto(file.url, { waitUntil: 'networkidle0' }); // wait for page to load completely
      }

      const pdfBuffer = await page.pdf(options);
      const pdfObj = { ...file, buffer: Buffer.from(Object.values(pdfBuffer)) };
      delete pdfObj.content;
      pdfs.push(pdfObj);
    }

    await browser.close();
    callback(null, pdfs);
  } catch (error) {
    callback(error);
  }
}

module.exports = {
  generatePdf,
  generatePdfs
};
