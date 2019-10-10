const grader = require('./dist/grader');
const gradeFile = grader.gradeFile_URL;
// const FILE = ``;

// gradeFile({
// 'file': FILE,
// }).then(r => console.log(r));
tests = [
// {
//     'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/W1test.mob',
//     'question': 'w1/w1',
//     'localTest': true,
//     'info': 'test'
// }
// ,
// {
//     'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/W2test.mob',
//     'question': 'w2/w2',
//     'localTest': true,
//     'info': 'test'
// }
// ,
// {
//     'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/W3test.mob',
//     'question': 'w3/w3',
//     'localTest': true,
//     'info': 'test'
// }
// ,
// {
//     'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/W3test-w.mob',
//     'question': 'w3/w3',
//     'localTest': true,
//     'info': 'test'
// }
// ,
// {
//     'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/W4t1.mob',
//     'question': 'w4/w4t1/w4t1',
//     'localTest': true,
//     'info': 'test'
// }
// ,
{
    'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/W4t2.mob',
    'question': 'w4/w4t2/w4t2',
    'localTest': true,
    'info': 'test'
}
]


// gradeFile(
//     {
//         'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/W1test.mob',
//         'question': 'w1/w1',
//         'localTest': true,
//         'info': 'test'
//     }
    
// ).then(r => {
//     console.log(JSON.stringify(r))
// });
tests.forEach(element => {
    gradeFile(
        element
        
    ).then(r => {
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!',r.score)
    });
    
});
