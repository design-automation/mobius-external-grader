const grader = require('./dist/grader');
const gradeFile = grader.gradeFile_URL;

tests = [
    // {
    //     'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/test_mb/f0',
    //     'question': 'assign_step1_ans',
    //     'localTest': true,
    //     'info': 'x'
    // }
    {
        'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/test_mb/f1',
        'question': 'w4_coding_assign_part2_ans',
        'localTest': true,
        'info': 'x'
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
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!',r.comment)
    });
    
});
