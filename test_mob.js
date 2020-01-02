const grader = require('./dist/grader');
const runFunc = grader.runMobFile;

const result = runFunc('https://raw.githubusercontent.com/phuongtung1/test_repo/master/test.mob');
result.then(r => {
    console.log('result:',r);
    console.log('>>>>>>><<<<<<<')
})
