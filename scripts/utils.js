var fs = require("fs");
var path = require("path");

module.exports = {
  deleteFolderRecursive: function (path, keepDir) {
    if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach(function(file, index) {
        var curPath = path + "/" + file;
        if (fs.lstatSync(curPath).isDirectory()) {
          // recurse
          module.exports.deleteFolderRecursive(curPath);
        } else {
          // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    }
  
    if (keepDir) {
      fs.mkdirSync(path);
    }
  },

  deleteFile: function(...paths) {
    paths.forEach(path => {
      if (fs.existsSync(path) && !fs.lstatSync(path).isDirectory()) {
        fs.unlinkSync(path);
      }
    });
  },

  copyFileSync: function (source, target) {
    var targetFile = target;
    //if target is a directory a new file with the same name will be created
    if (fs.existsSync(target)) {
      if (fs.lstatSync(target).isDirectory()) {
        targetFile = path.join(target, path.basename(source));
      }
    }
    fs.writeFileSync(targetFile, fs.readFileSync(source));
  },

  copyFolderRecursiveSync: function(source, target) {
    var files = [];
    //check if folder needs to be created or integrated
    var targetFolder = path.join(target, path.basename(source));

    //copy
    if (fs.lstatSync(source).isDirectory()) {
      files = fs.readdirSync(source);

      // skip folders that contain '.dontcopy' file
      if(!files.find(file => file === '.dontcopy')){
        if (!fs.existsSync(targetFolder)) {
          fs.mkdirSync(targetFolder);
        }

        files.forEach(function(file) {
          var curSource = path.join(source, file);
          if (fs.lstatSync(curSource).isDirectory()) {
            module.exports.copyFolderRecursiveSync(curSource, targetFolder);
          } else {
            module.exports.copyFileSync(curSource, targetFolder);
          }
        });
      }
    }
  },

  searchFiles: function(startPath, filter, output) {
    if (!fs.existsSync(startPath)){
        return;
    }
  
    var files=fs.readdirSync(startPath);
    for(var i=0;i<files.length;i++){
        var filename=path.join(startPath,files[i]);
        var stat = fs.lstatSync(filename);
        if (stat.isDirectory()){
          module.exports.searchFiles(filename,filter, output); //recurse
        }
        else if (filename.indexOf(filter)>=0) {
            output.push(filename);
        };
    };
  },

  fileToStr: function(path) {
    var file = fs.readFileSync(path, "utf8");
    return file;
  },

  strToFile: function(path, content) {
    module.exports.createDirAlongThePath(path);
    if(fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
    fs.writeFileSync(path, content);
  },

  createDirAlongThePath: function(filePath) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
      return true;
    }
    module.exports.createDirAlongThePath(dirname);
    fs.mkdirSync(dirname);
  }
}
