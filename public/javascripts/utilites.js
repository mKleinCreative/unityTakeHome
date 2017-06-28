function highestCost(file) {
  file.sort((a,b) => b.projectCost - a.projectCost)
  var currentDate = new Date()
  return file.filter( item => {
    if ( item.enabled && currentDate - item.expiryDate > 0 ) {
      return item
    }
  })[0]
}

const reduced = (file) => {
  console.log( '---===file===---', file )
  return file.reduce( ( acc, ele ) => {
    if ( Object.keys(acc).length < 1 ) {
      return ele
    }
    if ( ele.projectCost > acc.projectCost ) {
      return ele
    }
  }, {} )
}
var removeExpired = (file) => {

}

var remo = file => {
  
}

var removedDisabled = (file) => {

}
module.exports = {
  highestCost,
  reduced
}
