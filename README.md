# NBA Data Visualization Project
By Dominic Fernandez

## Website
<a href="https://nba-data-viz-project.web.app/">https://nba-data-viz-project.web.app/</a>

## Noteworthy Packages/Libraries
- d3.js (https://d3js.org/)
- Bootstrap 5 (https://getbootstrap.com/)
- rSlider.js (https://slawomir-zaziablo.github.io/range-slider/)

## Getting the Data
The data for this project was collected from <a href="https://github.com/swar/nba_api">swar's nba_api</a> using python. Follow the steps below to obtain the data.
- Install the nba_api by running `pip install nba_api`
- From the root of the project, navigate to `/data_processing` and run each `.py` file. These files will put the data as CSV or JSON inside of the `/data_processing/data` folder
- Move the files inside the `/data_processing/data` folder to the `/public/data` folder

## Running Locally
- Using `live-server` (or any other local server), open the `index.html` file in your web browser

## Roadmap
<b>Upcoming:</b>
- User-defined speed (in seconds) for time progression
- Responsive visualizations  
- Documentation and code refactoring/tidying up
