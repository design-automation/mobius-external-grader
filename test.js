const grader = require('./dist/grader');
const gradeFile = grader.gradeFile_URL;
// const FILE = ``;

// gradeFile({
// 'file': FILE,
// }).then(r => console.log(r));
// tests = [
//     {
//         'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/w1z',
//         'question': 'w1',
//         'localTest': true,
//         'info': 'test_w1'
//     },
//     {
//         'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/w2',
//         'question': 'w2',
//         'localTest': true,
//         'info': 'test_w2'
//     },
//     {
//         'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/w3',
//         'question': 'w3',
//         'localTest': true,
//         'info': 'test_w3'
//     },
//     {
//         'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/w4',
//         'question': 'w4',
//         'localTest': true,
//         'info': 'test_w4'
//     }
// ]
tests = [
    {
        'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/test_mb/f1',
        'question': 'assign_step1_ans',
        'localTest': true,
        'info': 'x'
    }
    // {
    //     'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/w3p',
    //     'question': 'w3p',
    //     'localTest': true,
    //     'info': 'x'
    // }
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
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!',r.comment)
    });
    
});
