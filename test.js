const grader = require('./dist/grader.1');
const gradeFile = grader.gradeFile_URL;
// const FILE = ``;

// gradeFile({
// 'file': FILE,
// }).then(r => console.log(r));
[
{
    'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/W1test.mob',
    'question': 'w1'
}
,
{
    'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/W2test.mob',
    'question': 'w2'
}
,
{
    'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/W3test.mob',
    'question': 'w3'
}
]


gradeFile(    {
    'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/W3test-w.mob',
    'question': 'w3'
}).then(r => {
    console.log(JSON.stringify(r))
});
