const grader = require('./dist/grader');
const gradeFile = grader.gradeFile_URL;

tests = [
    {
        'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/w2_s6_u2_w2_coding_assign_base0.mob',
        'question': 'w2_s6_u2_w2_coding_assign_ans.mob',
        'localTest': true,
        'info': 'x'
    }
    // {
    //     'file': 'https://raw.githubusercontent.com/phuongtung1/test_repo/master/t1',
    //     'question': 'w4_s6_u2_assign_gf_roof_ans.mob',
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
