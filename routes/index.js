var express = require('express');
// youre not using bodyParser anywhere in this file. 
var bodyParser = require('body-parser');
var router = express.Router();
var fs = require('fs')

// this will reset to 0 everytime you start the app. Is there a better place to get the
// highest number in the id sequence?
// … wait are you even using this variable?
var id = 0


// maybe name this makeProject ? it technically returns an object, not a JSON string
function makeProjectJSON(body, id) {
  // formats the project into a JSON object from the post request.
  var project = {};
  project.id = id
  project.projectName = body.projectName;
  project.creationDate = body.creationDate;
  project.expiryDate = body.expiryDate;
  project.enabled = true;
  project.targetCountries = body.targetCountries.map( country => country.toUpperCase() );
  project.projectCost = body.projectCost;
  project.projectUrl = body.projectUrl;
  project.targetKeys = body.targetKeys;
  return project
}

const getProjects = () => {
  // you should change the projects.txt to projects.json and just store an array as JSON in the file
  // get projects from projects.txt and format it into readable JSON
  var file = fs.readFileSync('projects.txt', 'utf8')
  var splitFile = file.split('\n')
  var parsedArray = splitFile.map( (row, index) => {
    // this is going to leave some undefined members in your `parsedArray` array
    if ( row.length > 0 ) {
      return JSON.parse( row )
    }
  })
  return parsedArray
}

function checkIfExpired(date){
  // format the date provided and check to see if it's past the current time.
  // why is your date string in such a weird format? Why not store it in a way that `new Date(dateString)` can parse?
  var expDate = date
  var dateArray = expDate.split(' ')
  var month = dateArray[0].slice(0,2)
  var day = dateArray[0].slice(2, 4)
  var year = dateArray[0].slice(4)
  var time = dateArray[1]
  var formattedTime = `${month}-${day}-${year} ${time}`
  console.log( '---===formattedTime===---', formattedTime )
  
  date = new Date(formattedTime)
  currentTime = Date.now()
  // remove these logs
  console.log( '---=== Dates are expired? ===---', date > currentTime )
  return date > currentTime
}

// this does more that just filter nulls, rename this function or break it up
const filterNulls = projectArray => {
  // Filter out projects that aren't enabled, aren't expired and don't have a project URL
  return projectArray
    .filter( project => project.enabled )
    .filter( project => checkIfExpired(project.expiryDate))
    .filter( project => project.projectUrl )
}

// rather than reduce, try using a sort and then returning the first element in the sorted array
const getProjectWithHighestCost = projectArray => {
  // Return the project with the highest cost using the project array
  return projectArray.reduce( ( acc, ele ) => {
    if ( Object.keys(acc).length < 1 ) {
      return ele
    }
    if ( ele.projectCost > acc.projectCost ) {
      return ele
    }
    return acc
  }, {} )
}

// remove this comment
/* GET home page. */
router.get('/', function(request, response, next) {
  response.json({ message: 'hooray! welcome to my api!' });
});

router.get('/requestProject', function(request, response, next) {
  // destructures the request
  var { projectId, country, number, keyword } = request.query;
  // gets the formatted projects from projects.txt
  // splitFile is a weird variable name, why not projects?
  var splitFile = getProjects()

  // if the project has an ID return the project
  if ( projectId ) {
    projectId = Number.parseInt(projectId)
    let project = splitFile.find(ele => ele.id === projectId)
    response.json({
      projectName: project.projectName,
      projectCost: project.projectCost,
      projectUrl: project.projectUrl
    })
  }
  else {
    // Otherwise through it through a line of checks going through and checking for the country, keyword or number provided.
    console.log( '---=== Filtered out invalid projects before ===---', splitFile )
    // why are you waiting to filter out the nulls? Why not do that in `getProjects` ?
    splitFile = filterNulls( splitFile )
    console.log( '---=== Filtered out invalid projects after ===---', splitFile )
    if ( country ) {
      // splitFile really should be name projects
      splitFile = splitFile.filter(ele => {
        return ele.targetCountries.includes(country)
      })
    }
    if ( number ) {
      splitFile = splitFile.filter(ele => ele.targetKeys.filter(item => item.number === number))
    }

    if ( keyword ) {
      splitFile = splitFile.filter(ele => ele.targetKeys.filter(item => item.keyword === keyword))
    }
    // the final result gets filtered for the highest cost. If no filters were met, it should come to this point 
    let result = getProjectWithHighestCost( splitFile )
    console.log( '---=== Campaign with highest cost returned ===---', splitFile )
    if (result) {
      response.json({
        projectName: result.projectName,
        projectCost: result.projectCost,
        projectUrl: result.projectUrl
      }) 
    } else {
      // if no results are found, return no projects found
      response.json({
        message: "no project found"
      })
    }
  }
})

router.post('/createProject', function(request, response) {
  // grabs the existing projects.txt file, deletes any empty lines in the file then iterates to the next Id
  var projectsArray = getProjects()
  var lastProject = projectsArray.pop()
  var lastID = lastProject.id

  lastID += 1

  var project = makeProjectJSON(request.body, lastID)
  
  console.log( '---=== Project object ===---', project )
  // appends the new project to the text file as a stringified object
  // I'd move all the projects file handling into its own file and API
  fs.appendFile('projects.txt', '\n' + JSON.stringify(project), 'utf-8', function (err) {
    if (err) throw err;
    console.log('campaign is successfully created');
  });
  response.sendStatus(200)
})




module.exports = router;
