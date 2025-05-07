const fs = require('fs');
const path = require('path');

/**
 * Reads an HTML file, injects the app bar and footer from their own files, and returns the final HTML.
 * @param {string} pageFilePath - The absolute path to the main HTML file.
 * @returns {Promise<string>} - The final HTML content with app bar and footer included.
 */
async function loadPage(pageFilePath) {

        // Read the main page file
        const pageContent =  fs.readFileSync(pageFilePath, 'utf8');
        console.log(pageContent);

        // Define the paths to the app bar and footer files
        const appBarPath = './public/components/appbar.html';
        const footerPath = './public/components/footer.html';
        const globalStylesPath = './public/components/global-styles.html';
        const globalScriptsPath = './public/components/global-scripts.html';

        // Read the app bar and footer content
        const [appBarHTML, footerHTML,styles, scripts] = await Promise.all([
            fs.readFileSync(appBarPath, 'utf8'),
            fs.readFileSync(footerPath, 'utf8'),
                fs.readFileSync(globalStylesPath, 'utf8'),
                fs.readFileSync(globalScriptsPath, 'utf8')
        ]);

        console.log(appBarHTML);
        console.log(footerHTML);
        // Replace placeholders in the main page
        return pageContent
            .replace('<!--GLOBAL_SCRIPTS-->',scripts)
            .replace('<!--GLOBAL_STYLES-->',styles)
            .replace('<!--APP_BAR-->', appBarHTML)
            .replace('<!--FOOTER-->', footerHTML);


}


module.exports = {loadPage}