#!/usr/bin/env node
const fs = require("fs");
var term = require("terminal-kit").terminal;
var ncp = require("ncp").ncp;
const hasYarn = require("has-yarn");
const isValidNpmName = require("is-valid-npm-name");
const npmName = require("npm-name");
const mkdirp = require("mkdirp");
var rimraf = require("rimraf");

// setup
term.on("key", function(name) {
  if (name === "CTRL_C") {
    terminate();
  }
});
let package_json = JSON.parse(
  fs.readFileSync(__dirname + "/resources/package.json")
);

// variables
var items = [
  hasYarn()
    ? "> yarn 🔥 (✔️ recommended)"
    : "> yarn 🔥 (✔️ recommended) 🔴 not installed 🙊",
  "> npm"
];
var manager;
var description;
var features = ["common"];

// functions
function terminate() {
  term.grabInput(false);
  term.red("\nCleanup & Exit");
  rimraf(process.cwd() + "/" + package_json.name, function() {
    process.exit();
  });
}

function end() {
  term.grabInput(false);
  setTimeout(function() {
    process.exit();
  }, 100);
}

function progress() {
  mkdirp(process.cwd() + "/" + package_json.name);

  var countDown = features.length;
  var progressBar;

  var functions = {
    common: function() {
      var task = "common";
      ncp(
        __dirname + "/resources/src/components/Example.tsx",
        process.cwd() + "/" + package_json.name + "/src/components/Example.tsx"
      );
      ncp(
        __dirname + "/resources/src/index.tsx",
        process.cwd() + "/" + package_json.name + "/src/index.tsx"
      );
      ncp(
        __dirname + "/resources/README.md",
        process.cwd() + "/" + package_json.name + "/README.md"
      );
      ncp(
        __dirname + "/resources/rollup.config.js",
        process.cwd() + "/" + package_json.name + "/rollup.config.js"
      );
      ncp(
        __dirname + "/resources/tsconfig.json",
        process.cwd() + "/" + package_json.name + "/tsconfig.json"
      );
      ncp(
        __dirname + "/.gitignore",
        process.cwd() + "/" + package_json.name + "/.gitignore"
      );
      done(task);
      setTimeout(start, 400 + Math.random() * 400);
    },
    jest: function() {
      var task = "jest";
      ncp(
        __dirname + "/resources/src/components/__tests__",
        process.cwd() + "/" + package_json.name + "/src/components/__tests__"
      );
      ncp(
        __dirname + "/resources/tsconfig.test.json",
        process.cwd() + "/" + package_json.name + "/tsconfig.test.json"
      );
      package_json = {
        ...package_json,
        ...{
          jest: {
            preset: "ts-jest",
            testEnvironment: "jsdom",
            testPathIgnorePatterns: ["build/"],
            globals: {
              "ts-jest": {
                tsConfig: "tsconfig.test.json"
              }
            }
          },
          standard: {
            ignore: ["node_modules/", "build/"],
            globals: ["describe", "it", "test", "expect", "afterAll", "jest"]
          }
        }
      };

      package_json.scripts = {
        ...package_json.scripts,
        ...{
          test: "jest --coverage"
        }
      };
      package_json.devDependencies = {
        ...package_json.devDependencies,
        ...{
          "@testing-library/jest-dom": "^5.1.0",
          "@testing-library/react": "^9.4.0",
          "@types/jest": "^25.1.1",
          jest: "^25.1.0",
          "ts-jest": "^25.1.0"
        }
      };
      done(task);
      setTimeout(start, 400 + Math.random() * 400);
    },
    storybook: function() {
      var task = "storybook";
      ncp(
        __dirname + "/resources/.storybook",
        process.cwd() + "/" + package_json.name + "/.storybook"
      );
      ncp(
        __dirname + "/resources/src/components/Example.stories.tsx",
        process.cwd() +
          "/" +
          package_json.name +
          "/src/components/Example.stories.tsx"
      );
      package_json.scripts = {
        ...package_json.scripts,
        ...{
          storybook: "start-storybook"
        }
      };
      package_json.devDependencies = {
        ...package_json.devDependencies,
        ...{
          "@storybook/react": "^5.3.10",
          "@babel/core": "^7.8.4",
          "babel-loader": "^8.0.6",
          "awesome-typescript-loader": "^5.2.1"
        }
      };
      done(task);
      setTimeout(start, 400 + Math.random() * 400);
    },
    next: function() {
      var task = "next";
      ncp(
        __dirname + "/resources/src/pages",
        process.cwd() + "/" + package_json.name + "/src/pages"
      );
      ncp(
        __dirname + "/resources/next-env.d.ts",
        process.cwd() + "/" + package_json.name + "/next-env.d.ts"
      );
      package_json.scripts = {
        ...package_json.scripts,
        ...{
          dev:
            manager +
            " build && " +
            (manager === "yarn"
              ? "yarn upgrade " + package_json.name + " --latest"
              : "npm i " + package_json.name + " --save") +
            " & next"
        }
      };
      package_json.devDependencies = {
        ...package_json.devDependencies,
        ...{
          next: "^9.2.1"
        }
      };
      done(task);
      setTimeout(start, 400 + Math.random() * 400);
    },
    package: function() {
      var json = JSON.stringify(package_json);
      var fs = require("fs");
      fs.writeFile(
        process.cwd() + "/" + package_json.name + "/package.json",
        json,
        "utf8",
        end
      );
    }
  };

  function done(task) {
    progressBar.itemDone(task);
    countDown -= 1;

    if (!countDown) {
      term.green("\n\nAll set up!\n");
      functions["package"]();
    }
  }

  function start() {
    var task = features.shift();
    functions[task]();
    progressBar.startItem(task);
  }

  if (!features.includes("jest")) {
    package_json.scripts = {
      ...package_json.scripts,
      ...{
        test: 'echo "No test specified"'
      }
    };
  }

  progressBar = term.progressBar({
    width: 80,
    title: "Running setup:",
    eta: true,
    percent: true,
    items: features.length,
    inline: false
  });

  start();
}

function continueWith() {
  if (manager === "yarn" && !hasYarn) {
    term.red.bgWhite(
      "\nWarning! Yarn is not installed go to https://classic.yarnpkg.com/en/docs/install and install it first\n\n"
    );
    term("Do You wish to switch to npm? [Y|n]");
    term.yesOrNo({ yes: ["y", "ENTER"], no: ["n"] }, function(error, result) {
      if (result) {
        term.green("Changing to npm. 🤷\n");
        manager = "npm";
        continueWith();
        return;
      } else {
        term.blue.bgWhite("\nCome back with yarn🔥 installed! 💫\n");
        terminate();
        return;
      }
    });
  } else {
    term("\nWould You like Storybook to be included? [Y|n]");
    term.yesOrNo({ yes: ["y", "ENTER"], no: ["n"] }, function(error, result) {
      result && features.push("storybook");
      result && mkdirp(process.cwd() + "/" + package_json.name + "/.storybook");
      term("\nWould You like Jest testing to be included? [Y|n]");
      term.yesOrNo({ yes: ["y", "ENTER"], no: ["n"] }, function(error, result) {
        result && features.push("jest");
        result &&
          mkdirp(
            process.cwd() +
              "/" +
              package_json.name +
              "/src/components/__tests__"
          );
        term(
          "\nWould You like 🔥Next.js🔥 to be included? (✔️ highly recommended) [Y|n]"
        );
        term.yesOrNo({ yes: ["y", "ENTER"], no: ["n"] }, function(
          error,
          result
        ) {
          if (result) {
            features.push("next");
            mkdirp(process.cwd() + "/" + package_json.name + "/src/pages");
            term("\n");
            progress();
            return;
          } else {
            term(
              "\n\nAre You shure? 🙊 Without Next.js You wont be able to properly test Your component library. 🙈 [Y|n]"
            );
            term.yesOrNo({ yes: ["y", "ENTER"], no: ["n"] }, function(
              error,
              result
            ) {
              !result && features.push("next");
              !result &&
                mkdirp(process.cwd() + "/" + package_json.name + "/src/pages");
              term("\n\n");
              progress();
              return;
            });
          }
        });
      });
    });
  }
}

function managerChoice() {
  term.wrap.green(
    "^GW^rh^Yi^uc^Mh ^bo^bn^ce ^rw^mo^Gu^rl^Yd ^uY^Mo^bu^r ❤ ^wto use: "
  );
  term.singleColumnMenu(items, function(error, choice) {
    manager = choice.selectedIndex === 1 ? "npm" : "yarn";
    continueWith();
  });
}

function provideData() {
  const questions = [
    " Your github name 👀 (or your company's): ",
    " Your desired package 🎁 name: ",
    " Fancy adding a description? 💁 (optional) Write it here: "
  ];
  const answers = [
    " You've set Your name to: '%s'\n",
    " You've set Your package name to: '%s'\n",
    " Description is there. \n\n"
  ];
  term("⭕" + questions[0]);
  term.inputField(function(error, input) {
    package_json = { ...package_json, ...{ author: input } };
    term.eraseLine();
    term.left(questions[0].length + input.length);
    term.green("✔️" + answers[0], input);
    term.yellow(
      "--------------------------------------------------------------------------\n| Note that If a package name is taken, You can use scoped nomenclature. |\n| Pattern:   @username/package-name                                      |\n--------------------------------------------------------------------------\n"
    );
    function specifyName() {
      term("⭕" + questions[1]);
      term.inputField(async function(error, input) {
        const check = isValidNpmName(input);
        if (check === true) {
          term.eraseLine();
          term.left(questions[1].length + input.length);
          const availability = await npmName(input);
          if (availability) {
            package_json = {
              ...package_json,
              ...{
                name: input,
                repository: {
                  type: "git",
                  url: package_json.author + "/" + input
                }
              }
            };
            // create folder
            mkdirp(process.cwd() + "/" + input);
            mkdirp(process.cwd() + "/" + input + "/src");
            mkdirp(process.cwd() + "/" + input + "/src/components");
            term.green("✔️ Package name is free! 🔥 \n");
            term.green(" ✔️" + answers[1], input);
            term("❔" + questions[2]);
            term.inputField(function(error, input) {
              description =
                input.length > 1
                  ? input
                  : "Your package's description should be here";
              term.eraseLine();
              term.left(questions[2].length + input.length);
              term.green("✔️" + answers[2]);
              package_json = {
                ...package_json,
                ...{ description: description }
              };
              managerChoice();
            });
          } else {
            term.red(
              "❌ Package name (%s) is already taken! 🙈 Try a different name.\n",
              input
            );
            specifyName();
            return;
          }
        } else {
          term.eraseLine();
          term.left(questions[1].length + input.length);
          term.red(
            "❌ Wrong npm name. 🙊\nError code: " + String(check) + "\n"
          );
          specifyName();
          return;
        }
      });
    }
    specifyName();
  });
}

// start
term("\n👋👋🏿👋👋🏿\n");
term.slowTyping(
  " Hello! \n\n",
  { flashStyle: term.brightCyan, style: term.blue.bgWhite },
  () =>
    term.slowTyping(
      "Starting setup ... \n\n",
      { flashStyle: term.brightCyan, style: term.green },
      provideData
    )
);
