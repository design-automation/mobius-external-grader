const grader = require('./dist/grader');
const gradeFile = grader.gradeFile_URL;
// const FILE = ``;

// gradeFile({
// 'file': FILE,
// }).then(r => console.log(r));


gradeFile({
    'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/W3test.mob',
    'question': ''
}).then(r => {
    console.log(JSON.stringify(r))
});
