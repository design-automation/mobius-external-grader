
const grader = require('./dist/grader');
const handler_function = grader.runGenEvalController;


test = {
    "id": "abcdef",
    "genUrl": "https://raw.githubusercontent.com/design-automation/mobius-parametric-modeller-dev/master/src/assets/testing/test_js_files/eaGen.js",
    "evalUrl": "https://raw.githubusercontent.com/design-automation/mobius-parametric-modeller-dev/master/src/assets/testing/test_js_files/eaEval1.js",
    "maxDesigns": 80
}


handler_function(test, null, null).then (r => {
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    console.log(r)

})
