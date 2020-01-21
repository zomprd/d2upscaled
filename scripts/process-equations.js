var utils = require('./utils');
var mjAPI = require("mathjax-node");

const pad = function(size, num) {
  var s = String(num);
  while (s.length < (size || 2)) {s = "0" + s;}
  return s;
}

module.exports = {
  processEquations: function () {
    mjAPI.config({
      MathJax : {
    },
    displayErrors : true,
    displayMessages : false
    });
    mjAPI.start();


    let equationFiles = [];
    utils.searchFiles('./static/slides/equations', '.tex', equationFiles);
    for (let file of equationFiles) {
      let equation = utils.fileToStr(file);
      let equations;
      if(equation.indexOf('\n') !== -1) { // tex file may contain multiple equations. If so, split them 
        equations = equation.split('\n');
      } else {
        equations = [equation];
      }
      let counter = 1;
      for(let eq of equations) {
        mjAPI.typeset({
          math: eq,
          useFontCache: false,
          format: 'inline-TeX', // or "inline-TeX", "MathML"
          svg: true, 
        }, function (data) {
          if (!data.errors) {
            utils.strToFile(file.replace('static/slides', 'build_pre').replace('static\\slides', 'build_pre')
            .replace('.tex', equations.length === 1 ? '.svg' : '_' + pad(2, counter++) + '.svg'), data.svg); // for multiple equations, use counter like _01.svg, _02.svg, _03.svg,...
          }
        });
      }
    }
  }
};