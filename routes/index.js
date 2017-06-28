var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var fs = require('fs')
var id = 0

function makeProjectJSON(body, id) {
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
  // get projects from projects.txt and format it into readable JSON
  var file = fs.readFileSync('projects.txt', 'utf8')
  var splitFile = file.split('\n')
  var parsedArray = splitFile.map( (row, index) => {
    if ( row.length > 0 ) {
      return JSON.parse( row )
    }
  })
  return parsedArray
}

function checkIfExpired(date){
  // format the date provided and check to see if it's past the current time.
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
  console.log( '---===date===---', date > currentTime )
  return date > currentTime
}

const filterNulls = projectArray => {
  // Filter out projects that aren't enabled, aren't expired and don't have a project URL
  console.log( '---===projectArray===---', projectArray )
  return projectArray
    .filter( project => project.enabled )
    .filter( project => checkIfExpired(project.expiryDate))
    .filter( project => project.projectUrl )
}

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

/* GET home page. */
router.get('/', function(request, response, next) {
  response.json({ message: 'hooray! welcome to my api!' });
});

router.get('/requestProject', function(request, response, next) {
  // destructures the request
  var { projectId, country, number, keyword } = request.query;
  // gets the formatted projects from projects.txt
  var splitFile = getProjects()

  // if the project has an ID return the project
  if ( projectId ) {
    let project = splitFile.filter(ele => ele.id === parseInt(projectId))[0]
    response.json({
      projectName: project.projectName,
      projectCost: project.projectCost,
      projectUrl: project.projectUrl
    })
  }
  else {
    // Otherwise through it through a line of checks going through and checking for the country, keyword or number provided.
    splitFile = filterNulls( splitFile )
    console.log( '---===splitFile1===---', splitFile )
    if ( country ) {
      splitFile = splitFile.filter(ele => {
        return ele.targetCountries.includes(country)
      })
    }
    console.log( '---===splitFile2===---', splitFile )
    if ( number ) {
      splitFile = splitFile.filter(ele => ele.targetKeys.filter(item => item.number === number))
    }

    if ( keyword ) {
      splitFile = splitFile.filter(ele => ele.targetKeys.filter(item => item.keyword === keyword))
    }
    // the final result gets filtered for the highest cost. If no filters were met, it should come to this point 
    let result = getProjectWithHighestCost( splitFile )
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
  // appends the new project to the text file as a stringified object
  fs.appendFile('projects.txt', '\n' + JSON.stringify(project), 'utf-8', function (err) {
    if (err) throw err;
    console.log('campaign is successfully created');
  });
  response.sendStatus(200)
})




module.exports = router;
