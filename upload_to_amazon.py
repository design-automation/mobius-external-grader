# TO USE THIS FILE:
# _ install the following packages: boto3
# _ rename __AMAZON_KEY__.template.py to __AMAZON_KEY__.py and add your own amazon access id, key and mobius directory to the file
# _ change FUNC_NAME to be whichever function you want to update

import boto3
import os
import shutil
import zipfile
import json
import subprocess

try:
    import __AMAZON_KEY__
except ImportError:
    print('\n\n\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n')
    print('missing __AMAZON_KEY__.py:')
    print('  Please rename __AMAZON_KEY__.template.py to __AMAZON_KEY__.py')
    print('  and add in your amazon access id and secret key to the file. The access id and secret key')
    print('  can be found in Amazon IAM under your own username, Security Credential tab, Access Keys section')
    print('\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n\n\n')
    
    raise ImportError()



dist_package_json_file = 'dist_package.json'

# access id and key and your mobius folder directory, getting from __AMAZON_KEY__.py file
aws_access_key_id = __AMAZON_KEY__.aws_access_key_id
aws_secret_access_key = __AMAZON_KEY__.aws_secret_access_key

# mobius_directory = 'C:\\Users\\akibdpt\\Documents\\Angular\\mobius-parametric-modeller'
# mobius_directory = 'C:\\Users\\akibdpt\\Documents\\Angular\\mobius-parametric-modeller-dev'
mobius_directory = 'C:\\Users\\akibdpt\\Documents\\Angular\\mobius-parametric-modeller-dev-0-6'

# the lambda function name
MAIN_FUNCTION = 'arn:aws:lambda:us-east-1:114056409474:function:Mobius_edx_Grader'
DEV_FUNCTION  = 'arn:aws:lambda:us-east-1:114056409474:function:Mobius_edx_Grader_DEV'
RUN_JAVASCRIPT_FUNC = 'arn:aws:lambda:us-east-1:114056409474:function:Mobius_Run_Javascript'
GEN_FUNC = 'arn:aws:lambda:us-east-1:114056409474:function:generate_design_func'
EVAL_FUNC = 'arn:aws:lambda:us-east-1:114056409474:function:evaluate_design_func'
CTRL_FUNC = 'arn:aws:lambda:us-east-1:114056409474:function:Gen_Eval_Controller'

# !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
# change this FUNC_NAME to whichever function you want to update
FUNC_NAME = [
    # MAIN_FUNCTION

    # DEV_FUNCTION
    # RUN_JAVASCRIPT_FUNC

    EVAL_FUNC,
    GEN_FUNC,
    CTRL_FUNC,

    # GEN_FUNC,
    # EVAL_FUNC
]


def copy_from_mobius():
    print('\n\nCopying files from Mobius...')

    current_working_dir = os.getcwd()

    core_dir = mobius_directory + '\\src\\assets\\core'
    libs_dir = mobius_directory + '\\src\\assets\\libs'
    destination = current_working_dir + '\\src'

    try:
        shutil.rmtree(current_working_dir + '\\src\\core')
    except Exception:
        pass
    try:
        shutil.rmtree(current_working_dir + '\\src\\libs')
    except Exception:
        pass
    os.mkdir(current_working_dir + '\\src\\core')
    os.mkdir(current_working_dir + '\\src\\libs')

    copy_files(core_dir, destination)
    copy_files(libs_dir, destination)

    packageJSONFile = os.path.join(current_working_dir, dist_package_json_file)
    packageJSONDest = os.path.join(current_working_dir, 'dist\\package.json')
    if not os.path.isdir(os.path.join(current_working_dir,'dist')):
        os.mkdir(os.path.join(current_working_dir,'dist'))
    shutil.copy(packageJSONFile, packageJSONDest)
    print('Copying completed')

def copy_files(fromDir, toDir):
    os_walk_dir = os.walk(fromDir)
    for root, dirs, files in os_walk_dir:

        subDir = root.split('assets')[-1]
        for folder in dirs:
            newDir = os.path.join(toDir + subDir, folder)
            if os.path.isfile(newDir):
                os.remove(newDir)
            if not os.path.isdir(newDir):
                os.mkdir(newDir)
        for f in files:
            core_f = os.path.join(root, f)
            print('    copying:', os.path.join(subDir, f))
            if os.path.isfile(core_f):
                shutil.copy(core_f, toDir + subDir)

def build_code():
    print('\n\nBuilding code...')
    # os.system("tsc -p .")
    result = subprocess.run(["tsc", "-p", '.'], shell=True, stdout=subprocess.PIPE).stdout.decode('utf-8')
    if 'error' in result:
        print('\nERROR: Building code failed:\n')
        print(result)
        return False
    # subprocess.run(["ls", "-l"])
    print('Building code completed')
    return True

def zipdir():
    print('\n\nZipping files in dist folder...')
    zipPath = 'dist/'

    # create ziph: zipfile handle
    ziph = zipfile.ZipFile('zipped_file/zip_grader.zip', 'w', zipfile.ZIP_DEFLATED)
    count = 0
    for root, dirs, files in os.walk(zipPath):
        count += 1
        for file in files:
            fDir = os.path.join(root, file)
            print('    Zipping', fDir)
            ziph.write(fDir, os.path.join(root[5:], file))
    ziph.close()
    if count == 0:
        print('Error: No dist folder to be zipped')
        return False
    else:
        print('Zipping completed')
        return True


def upload_to_amazon(zipfile, funcName):
    print('\n\nUploading zipped file to amazon...')
    lambda_client = boto3.client('lambda', 
                    region_name='us-east-1',
                    aws_access_key_id = aws_access_key_id,
                    aws_secret_access_key = aws_secret_access_key)
    r = lambda_client.update_function_code(FunctionName= funcName, ZipFile=zipfile)
    print('Uploading completed')
    for i in r:
        print('   ', i ,':', r[i])
    print()


if __name__ == '__main__':
    # copy_from_mobius()
    buildcheck = build_code()
    if buildcheck:
        zipcheck = zipdir()
        if zipcheck:
            zippedFile = open('zipped_file/zip_grader.zip', 'rb').read()
            for funcName in FUNC_NAME:
                upload_to_amazon(zippedFile, funcName)


