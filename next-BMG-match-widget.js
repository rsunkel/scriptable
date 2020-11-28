/* Scriptable Widget to get the next match of Borussia Mönchengladbach (due to API-restrictions – Free Tier-only! – except Friendlies and Cup-matches) providing some additional data for both teams on tap

Version: 0.9

Author: Reiner Sunkel
E-Mail: roennsen@gmail.com

Football data provided by the Football-Data.org API
You'll need an account – Free Tier available! – there to get an API Token to get this script running.*/


// General api stuff and the first request
// DO NOT PUBLISH the token
const apiToken = ''

// ID of Borussia Mönchengladbach – may be changed 
const myTeamId = 18

// Request to get the next scheduled matches of my Team
const apiRequest = 'http://api.football-data.org/v2/teams/'+myTeamId+'/matches?status=SCHEDULED'


// Define some display-modes
// @todo: smarter handling ;-)
let widgetMode = null
if (args.widgetParameter == 'Detail')
    widgetMode = 'Detail'

let widget = await createWidget()

// Handling for non-widget-/detail-usage
if (!config.runsInWidget) {
	if (!args.widgetParameter){
		await widget.presentSmall()
	}
    else
        await widget.presentLarge()
}

Script.setWidget(widget)
Script.complete()

async function createWidget() {

	let list = new ListWidget()
	
	// Some general widget styling
	// @todo: smarter handling ;-)
	list.setPadding(-5, 0, 0, 0)
	list.spacing = 2
	
	// api request to get the scheduled matches
	let matchRequest = new Request(apiRequest)
	matchRequest.headers = {'X-Auth-Token' : apiToken};
	let data = await matchRequest.loadJSON()
	
	// Some basic error handling
	// @todo: guess what?!
	if (data.errorCode){
    	list.addText (data.message)
    	return list
    }
    
    // Data-extracting, adding and styling
    // @todo: guess what?!
    let competitionAndMatchday = list.addText(data.matches[0].competition.name.toUpperCase() + '\n' + data.matches[0].matchday + '. Spieltag')
    competitionAndMatchday.centerAlignText()
    competitionAndMatchday.font = Font.lightMonospacedSystemFont(10)
    competitionAndMatchday.textColor = new Color('#cccccc')
    
    // use spacer only in Widget-view
    if (config.widgetFamily != null)
    	list.addSpacer(10)
    
    let homeTeam =  list.addText(data.matches[0].homeTeam.name)
    homeTeam.centerAlignText()
    homeTeam.font = Font.blackMonospacedSystemFont(11)
    
    let vsString = list.addText ('vs')
    vsString.centerAlignText()
    vsString.font = Font.lightMonospacedSystemFont(9)
    
    let awayTeam = list.addText(data.matches[0].awayTeam.name)
    awayTeam.centerAlignText()
    awayTeam.font = Font.heavyMonospacedSystemFont(11)
    
    // use spacer only in Widget-view
    if (config.widgetFamily != null)
    	list.addSpacer(5)
  
	// some date declaration for further requests
	let dateToday = new Date()
	
	let dateTo = ''+dateToday.getFullYear()+'-'+(dateToday.getMonth()+1)+'-'+dateToday.getDate()
	
	let dateFrom =''+dateToday.getFullYear()+'-'+dateToday.getMonth()+'-'+dateToday.getDate()
	
	// Some date adjustation & formatting
	let rawMatchDateString = data.matches[0].utcDate
	
	let dateFormatter = new DateFormatter()
	dateFormatter.dateFormat = 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''
	
	let convertedRawMatchDate = dateFormatter.date(rawMatchDateString)
	convertedRawMatchDate.setHours(convertedRawMatchDate.getHours()+1)
	let newDateFormatter = new DateFormatter()
	newDateFormatter.locale = 'de_DE'
	newDateFormatter.dateFormat = 'EEEE, d.M.y\n H:mm\' Uhr\''
	
	let newDateString = newDateFormatter.string(convertedRawMatchDate)
	
	let matchDate = list.addText(newDateString)
	matchDate.centerAlignText()
	matchDate.font = Font.lightMonospacedSystemFont(10)
	
	// Detail-View
	// Get, add & style additional data
	if(widgetMode == 'Detail' && !config.runsInWidget){
    	
    	// Some general widget styling
		// @todo: add Stack for better UX
    	list.setPadding(20, 20, 20, 20)
    	list.spacing = 2
    	competitionAndMatchday.leftAlignText()
    	homeTeam.leftAlignText()
    	vsString.leftAlignText()
    	awayTeam.leftAlignText()
		matchDate.leftAlignText()
    
		// Some String replacement for Detail-view
		// @todo: ...
		matchDate.text = matchDate.text.replace('\n', ', Anstoß: ')
		competitionAndMatchday.text = competitionAndMatchday.text.replace('\n', ' // ')
		
		// Another Api-requests to analyze your own team
		let apiRequestPlayedMatchesMyTeam = 'http://api.football-data.org/v2/teams/'+myTeamId+'/matches?status=FINISHED&dateFrom='+dateFrom+'&dateTo='+dateTo
		
		let playedMatchesRequestMyTeam = new Request(apiRequestPlayedMatchesMyTeam)
		playedMatchesRequestMyTeam.headers = {'X-Auth-Token' : apiToken};
		
		let playedMatchesMyTeamData = await playedMatchesRequestMyTeam.loadJSON()
		
		// Some basic error handling
		if (playedMatchesMyTeamData.errorCode){
			list.addText (data.message)
			return list
		}

		// Some vars to show in Detail-view
		let myTeamResults = new Array()
		let myTeamPoints = 0
		let myTeamFormPoints = 0
		let myTeamFormLastResult = null //maybe used later
		let myTeamFormSameResultCounter = 0 //maybe used later
		
		// Adding data to vars
		for (var i=0; i<playedMatchesMyTeamData.count; i++){
			
			if (playedMatchesMyTeamData.matches[i].score.winner == 'DRAW') {
				myTeamResults[i] = 'U'
				myTeamPoints += 1
			}
			else if (playedMatchesMyTeamData.matches[i].score.winner == 'HOME_TEAM' && playedMatchesMyTeamData.matches[i].homeTeam.id == myTeamId){
				myTeamResults[i] = 'S'
				myTeamPoints += 3
				myTeamFormPoints += 1
			}
			else if (playedMatchesMyTeamData.matches[i].score.winner == 'AWAY_TEAM' && playedMatchesMyTeamData.matches[i].awayTeam.id == myTeamId){
				myTeamResults[i] = 'S'
				myTeamPoints += 3
				myTeamFormPoints += 1
			}
			else {
				myTeamResults[i] = 'N'
				myTeamFormPoints -= 1
			}
		}

		// Another Api-requests to analyze the opponent team
		let apiRequestPlayedMatchesEnemyTeam = 'http://api.football-data.org/v2/teams/'+data.matches[0].awayTeam.id+'/matches?status=FINISHED&dateFrom='+dateFrom+'&dateTo='+dateTo
		
		let playedMatchesRequestEnemyTeam = new Request(apiRequestPlayedMatchesEnemyTeam)
		playedMatchesRequestEnemyTeam.headers = {'X-Auth-Token' : apiToken};
		
		let playedMatchesEnemyTeamData = await playedMatchesRequestEnemyTeam.loadJSON()
		
		// Some basic error handling
		if (playedMatchesEnemyTeamData.errorCode){
			list.addText (data.message)
    		return list
    	}

		let enemyTeamId =  data.matches[0].awayTeam.id
		let enemyTeamResults = new Array()
		let enemyTeamPoints = 0
		let enemyTeamFormPoints = 0
		let enemyTeamFormLastResult = null //maybe used later
		let enemyTeamFormSameResultCounter = 0 //maybe used later
		
		for (var i=0; i<playedMatchesEnemyTeamData.count; i++){
		
			if (playedMatchesEnemyTeamData.matches[i].score.winner == 'DRAW') {
				enemyTeamResults[i] = 'U'
				enemyTeamPoints += 1
			}
 			else if (playedMatchesEnemyTeamData.matches[i].score.winner == 'HOME_TEAM' && playedMatchesEnemyTeamData.matches[i].homeTeam.id == enemyTeamId){
				enemyTeamResults[i] = 'S'
				enemyTeamPoints += 3
            	enemyTeamFormPoints +=1
            }
			else if (playedMatchesEnemyTeamData.matches[i].score.winner == 'AWAY_TEAM' && playedMatchesEnemyTeamData.matches[i].awayTeam.id == enemyTeamId){
				enemyTeamResults[i] = 'S'
				enemyTeamPoints += 3
				enemyTeamFormPoints += 1
			}
			else {
				enemyTeamResults[i] = 'N'
				enemyTeamFormPoints -=1
			}
		}
  	
  		list.addSpacer(15)
  	
  		let analasysStack =  list.addStack()
		analasysStack.layoutVertically()
		analasysStack.backgroundColor = new Color ('#013220')
		analasysStack.setPadding(8,8,8,8)
		analasysStack.borderColor = new Color('111')
		analasysStack.borderWidth = 2
		analasysStack.cornerRadius = 5
    
    	let aHeadline = analasysStack.addText('Analyse'.toUpperCase())
    	aHeadline.font = Font.heavyMonospacedSystemFont(9)
    
    	let aDateInfo = analasysStack.addText('Zeitraum: '+dateFrom+' bis '+dateTo)
    	aDateInfo.font = Font.lightMonospacedSystemFont(8)
    
    	let jData = analasysStack.addText('\nLetzte Ergebnisse: \nWir: '+myTeamResults.toString()+'\nDie: '+enemyTeamResults.toString()+'\n\nØ Punkte:\nWir: '+((myTeamPoints/playedMatchesMyTeamData.count).toFixed(2))+'\nDie: '+(enemyTeamPoints/playedMatchesEnemyTeamData.count).toFixed(2)+'\n\nForm:\nWir: '+myTeamFormPoints+'\nDie: '+enemyTeamFormPoints)
    	jData.font = Font.lightMonospacedSystemFont(9)
	}

	return list
}
