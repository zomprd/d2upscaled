var utils = require("./utils");
var process_equations = require('./process-equations');

utils.deleteFolderRecursive("build", true);
utils.deleteFolderRecursive("build_pre", true);
utils.copyFolderRecursiveSync("assets", "build");
// copy other static files
utils.copyFolderRecursiveSync("static", "build");
process_equations.processEquations();