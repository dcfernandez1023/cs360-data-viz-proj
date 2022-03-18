const projectSchedule = [
    {deadline: "3/11/22", task: "Project Proposal Rough Draft"},
    {deadline: "3/23/22", task: "Project Proposal Final Draft"},
    {deadline: "3/26/22", task: "Process data (conver JSON from python APIs to CSV)"},
    {deadline: "3/28/22", task: "HTML Skeleton for website.  Pages 1-3 of the Visualization Design should have the base HTML and basic JS functionality (no visualizations yet, just skeleton to hold the visualizations)"},
    {deadline: "3/29/22", task: "Set up CI/CD pipeline to auto deploy to cloud server (Firebase) using Github Actions"},
    {deadline: "4/6/22", task: "Alpha Release. Should include: Section 1, Section 2 (time progression + pop-up modal with visualizations), Section 3 (line chart with default data)"},
    {deadline: "4/20/22", task: "Beta Release. Should include everything in the Alpha release, but with the toggeable features and Optional features (if they are doable/reasonable to implement)"},
    {deadline: "5/9/22", task: "Final Project Presentation"},
    {deadline: "5/16/22", task: "Project Report Draft"},
    {deadline: "5/19/22", task: "Project report, slides, demo video, code & data, user manual"}
];

const renderProjectSchedule = () => {
    let tableBody = document.getElementById("projectScheduleBody");
    projectSchedule.forEach((item) => {
        let tr = document.createElement("tr");
        let td1 = document.createElement("td");
        let td2 = document.createElement("td");

        td2.style.textAlign = "center";
        
        td1.innerHTML = item.task;
        td2.innerHTML = item.deadline;
        
        tr.appendChild(td1);
        tr.appendChild(td2);
        tableBody.appendChild(tr);
    });
}
