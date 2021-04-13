let request = require("request");
let cheerio = require("cheerio");
let fs = require("fs");
const {jsPDF} = require("jspdf");
let $;
let data = {};

request("https://github.com/topics", requestHandler);

function requestHandler(err, res, body){
    if(!err){
        $ = cheerio.load(body);
        let topicsAnchors = $(".no-underline.d-flex.flex-column.flex-justify-center");
        let topicsName = $(".f3.lh-condensed.text-center.Link--primary.mb-0.mt-1");
        for(let i = 0; i < topicsAnchors.length; i++){
            fs.mkdirSync($(topicsName[i]).text().trim());
            let link = "https://github.com" + $(topicsAnchors[i]).attr("href");
            let name = $(topicsName[i]).text().trim();
            getAllProjects(link, name);
        }
    }
}

function getAllProjects(url, name){
    request(url, function(err, res, body){
        if(!err){
            $ = cheerio.load(body);
            let allProjects = $(".f3.color-text-secondary.text-normal.lh-condensed .text-bold");
            if(allProjects.length > 8){
                allProjects = allProjects.slice(0, 8);
            }
            for(let i = 0; i < allProjects.length; i++){
                let projectUrl = "https://github.com" + $(allProjects[i]).attr("href");
                let projectName = $(allProjects[i]).text().trim();

                if(!data[name]){
                    data[name] = [{projectName, projectUrl}];
                } else{
                    data[name].push({projectName, projectUrl});
                }

                getIssues(projectUrl, projectName, name);
            }
        }
    });
}

function getIssues(url, projectName, topicName){
    request(url + "/issues", function(err, res, body){
        $ = cheerio.load(body);
        let allIssues = $(".Link--primary.v-align-middle.no-underline.h4.js-navigation-open.markdown-title");
        for(let  i = 0; i < allIssues.length; i++){
            let issueTitle = $(allIssues[i]).text().trim();
            let issueUrl = "https://github.com" + $(allIssues[i]).attr("href");

            let index = data[topicName].findIndex(function(e){
                return e.projectName == projectName;
            });

            if(!data[topicName][index].issues){
                data[topicName][index].issues = [{issueTitle, issueUrl}];
            } else{
                data[topicName][index].issues.push({issueTitle, issueUrl});
            }
        }
        pdfGenerator();
    });
}

function pdfGenerator(){
    for(let x in data){
        let tArr = data[x];
        for(let y in tArr){
            let pName = tArr[y].projectName;
            if(fs.existsSync(`${x}/${pName}.pdf`)){
            fs.unlinkSync(`${x}/${pName}.pdf`);
            }
            const doc = new jsPDF();
            for(let z in tArr[y].issues){
                doc.text(tArr[y].issues[z].issueTitle, 10, 10 + 22 * z);
                doc.text(tArr[y].issues[z].issueUrl, 10, 18 + 22 * z);
            }
            doc.save(`${x}/${pName}.pdf`);
        }
    }
}

