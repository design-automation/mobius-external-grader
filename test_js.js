
const grader = require('./dist/grader');
// const runFunc = grader.runJavascriptFile;

// tests = [
//     {
//         'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/eaEval-0-6.js',
//         // 'parameters': {
//         //     'segments': 10,
//         //     'slices': 10
//         // }
//     }
// ]


// tests.forEach(element => {
//     runFunc(
//         element
//     ).then(r => {
//         console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!')
//         console.log(r)
//     });
    
// });

const runFunc = grader.runJavascriptFileTest;
tests = [
    {
        'file': 'https://mobius-evo-userfiles131353-dev.s3.amazonaws.com/errors/a8ed9ac0-8aac-4739-97a2-f3636dcaaa89_0',
        // 'parameters': {
        //     'segments': 10,
        //     'slices': 10
        // }
    }
]
tests.forEach(element => {
    runFunc(
        element
    ).then(r => {
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!')
        console.log(r)
    });
    
});
