# Interactive Charts for our Capstone Project

Webpage available at [capstone-charts.afiqket.workers.dev](https://capstone-charts.afiqket.workers.dev/)

## How to add new charts

We shall use git to clone (download) the code from this repository, then commit (save changes) and push (upload) to the repository after making changes.

Make sure [git is installed](https://git-scm.com/install/windows) first.

### 1. Clone (download)

Make a new folder to put this code in. Open a new terminal in that folder.

To clone (download) the code:
```bash
git clone https://github.com/afiqket/capstone-charts.git
``` 
this should prompt you to sign in to github. Click the blue "Sign in with your browser" button and continue with your login.

The code should be downloaded to your computer in a new folder named "capstone-charts"

Enter that folder:
```bash
cd capstone-charts
``` 

### 2. Update (pull)

If you just downloaded, or have downloaded before, there might be some changes that other people have done. To download these new changes, use:
```bash
git pull origin main
``` 

### 3. Add a new chart

From your Observable notebook, click the [...] button on the top right, then Export, then Download Code. This will download a .tgz file. Put that file into the capstone-charts folder. Do not extract/unzip it.

Run the given python file to extract that .tgz file into the files that are required:
```bash
python extract_charts.py
```
This should:
- Update charts.csv with a new row (Chart title, JS file name)
- Add a new JS file
- Add a new csv file for data

### 4. Save changes (add, commit)

To tell git what files we want saved, use this. The ``.`` is for any newly created files or any modified files in the current directory:
```bash
git add .
```

To save changes, use this. You must give a brief description of what you changed, so other people can now what you've done. It can be simple.
```bash
git commit -m "Added chart: Population in US "
```

### 5. Upload (push)

Finally, you can upload your new changes to the GitHub repository (this website).
```bash
git push origin main
```

The changes should be reflected here.

### Conclusion
For your first time, to download the code, run:
```bash
git clone https://github.com/afiqket/capstone-charts.git
cd capstone-charts
```

If you already have the code downloaded, put the .tgz file from observable in the capstone-charts folder. Open the terminal in that folder, then run the commands below. Please don't forget to change the commit message to what you have changed:
```bash
git pull origin main
python extract_charts.py
git add .
git commit -m "New commit"
git push origin main
```

