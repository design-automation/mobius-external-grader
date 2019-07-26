const grader = require('./dist/grader');
const gradeFile = grader.gradeFile_URL;
// const FILE = ``;

// gradeFile({
// 'file': FILE,
// }).then(r => console.log(r));


gradeFile({
    'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/modded_foreach.mob',
    'question': 'foreach_test'
}).then(r => {
    console.log(JSON.stringify(r))
});
// gradeFile({
//     'file': 'https://raw.githubusercontent.com/design-automation/mobius-external-grader/master/grader_test.mob',
// }).then(r => {
//     console.log(JSON.stringify(r))
// });
