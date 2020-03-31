
const grader = require('./dist/grader');
const runFunc = grader.runJavascriptFile;


tests = [
    {
        'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/testtest.js',
        'parameters': {
            'segments': 10,
            'slices': 10
        }
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
