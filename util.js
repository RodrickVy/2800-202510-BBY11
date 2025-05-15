const fs = require("fs");
const path = require("path");

/**
 * Reads an HTML file, injects the app bar and footer from their own files, and returns the final HTML.
 * @param {string} pageFilePath - The absolute path to the main HTML file.
 * @returns {Promise<string>} - The final HTML content with app bar and footer included.
 */
async function loadPage(pageFilePath) {
  // Read the main page file
  const pageContent = fs.readFileSync(pageFilePath, "utf8");
  console.log(pageContent);

  // Define the paths to the app bar and footer files
  const appBarPath = "./public/components/appbar.html";
  const footerPath = "./public/components/footer.html";
  const globalStylesPath = "./public/components/global-styles.html";
  const globalScriptsPath = "./public/components/global-scripts.html";

  // Read the app bar and footer content
  const [appBarHTML, footerHTML, styles, scripts] = await Promise.all([
    fs.readFileSync(appBarPath, "utf8"),
    fs.readFileSync(footerPath, "utf8"),
    fs.readFileSync(globalStylesPath, "utf8"),
    fs.readFileSync(globalScriptsPath, "utf8"),
  ]);

  console.log(appBarHTML);
  console.log(footerHTML);
  // Replace placeholders in the main page
  return pageContent
    .replace("<!--GLOBAL_SCRIPTS-->", scripts)
    .replace("<!--GLOBAL_STYLES-->", styles)
    .replace("<!--APP_BAR-->", appBarHTML)
    .replace("<!--FOOTER-->", footerHTML);
}

function getCareerIcon(title) {
  const iconMap = {
    'Software Developer': 'bi-code-slash',
    'Data Analyst': 'bi-bar-chart-line',
    'UX Designer': 'bi-layout-text-window-reverse',
    'Cybersecurity Specialist': 'bi-shield-lock',
    'Product Manager': 'bi-kanban',
    'Machine Learning Engineer': 'bi-cpu',
    'DevOps Engineer': 'bi-gear-wide-connected',
    'Cloud Engineer': 'bi-cloud',
    'Mobile App Developer': 'bi-phone',
    'QA Engineer': 'bi-bug',
    'IT Support Specialist': 'bi-headset',
    'Full Stack Developer': 'bi-stack',
    'Game Developer': 'bi-controller',
    'Technical Writer': 'bi-file-earmark-text',
    'Web Designer': 'bi-palette',
    'Data Engineer': 'bi-database-gear',
    'UI Designer': 'bi-vector-pen',
    'Systems Analyst': 'bi-diagram-3',
    'Database Administrator': 'bi-database-check',
    'AI Researcher': 'bi-robot'
  };

  return iconMap[title] || 'bi-briefcase';
}

//Define the include function for absolute file name
global.base_dir = __dirname;
global.abs_path = function (path) {
  return base_dir + path;
};
global.include = function (file) {
  return require(abs_path("/" + file));
};

module.exports = { loadPage, getCareerIcon };
