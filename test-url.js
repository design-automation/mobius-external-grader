const grader = require('./dist/grader');
const gradeFile = grader.gradeFile_URL;

var url_list = [
    {
        "name": "Basic Examples",
        "files": [
            "basic_variable.mob",
            "basic_ifelse.mob",
            "basic_foreach.mob",
            "basic_while.mob"
        ],
        "link": "https://raw.githubusercontent.com/design-automation/mobius-parametric-modeller/master/src/assets/gallery/basic_examples/"
    },
    {
        "name": "Function Examples",
        "files": [
            "make.Position.mob",
            "make.Point.mob",
            "make.Polyline.mob",
            "make.Polygon.mob",
            "make.Collection.mob"
        ],
        "link": "https://raw.githubusercontent.com/design-automation/mobius-parametric-modeller/master/src/assets/gallery/function_examples/"
    },
    {
        "name": "Shapes Examples",
        "files": [
            "torus.mob"
        ],
        "link": "https://raw.githubusercontent.com/design-automation/mobius-parametric-modeller/master/src/assets/gallery/shapes_examples/"
    },
    {
        "name": "Flow Examples",
        "files": [
            "podium_with_towers.mob"
        ],
        "link": "https://raw.githubusercontent.com/design-automation/mobius-parametric-modeller/master/src/assets/gallery/flow_examples/"
    },
    {
        "name": "Rendering Examples",
        "files": [
            "glass_materials.mob",
            "front_and_back_materials.mob"
        ],
        "link": "https://raw.githubusercontent.com/design-automation/mobius-parametric-modeller/master/src/assets/gallery/rendering_examples/"
    },
    {
        "name": "User Function Examples",
        "files": [
            "hello_example.mob",
            "hello_func.mob",
            "pyramids_from_pgons_example.mob",
            "pyramids_from_pgons_func.mob",
            "div_pgons_example1.mob",
            "div_pgons_example2.mob",
            "div_pgons_func.mob",
            "offset_floors_and_windows_example.mob",
            "offset_pgons_func.mob"
        ],
        "link": "https://raw.githubusercontent.com/design-automation/mobius-parametric-modeller/master/src/assets/gallery/user_functions_examples/"
    },
    {
        "name": "AR2524, Examples Exercise 1",
        "files": [
            "jiaying.mob"
        ],
        "link": "https://raw.githubusercontent.com/design-automation-edu/spatial-computational-thinking-2019/master/exercise1/"
    }
]


// some test files might give correct = false and score = 0 due to the file being old (outdated functions etc...)
for (const url_set of url_list){
    for (const file_name of url_set['files']){
        const set_name = url_set['name'];
        const file_url = url_set['link'] + file_name;
        gradeFile({
            'file': file_url,
        }).then(r => {
            console.log('\n', set_name, file_name, JSON.stringify(r))
        });
    }
}
