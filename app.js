        var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");
var server = restify.createServer();


server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

server.post('/api/messages', connector.listen());

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] })
var bot = new builder.UniversalBot(connector);

bot.set('storage', tableStorage);
bot.dialog('/', intents);    

bot.endConversationAction('See you Later :)', 'Bye :) <br/> Exiting...', { matches: /^(goodbye)|(bye)|(exit)|(end)|(quit)/i });


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////        
        
slot_mess = ['breakfast',"lunch","dinner"];  
meals = [['Masala Dosa, Sambhar, Chutney ','Mix. Veg, Masoor Dal, Boondi Raita','Kadhai Paneer/Kadhai Chicken, Yellow Moong Dal, Sevai Kheer'],['Idli,Coconut Chutney,Sambhar','Aloo matar,Arhar Dal,Tamarind Rice','Chhole bhature,Panchratni Dal,Pulao,Veg Chutney, Hot and Sour Soup'],['Poori/Paratha,Aloo Sabji','Gobi Masala, Rajma,Singhada/Keenu','Palak(No Aloo), Missi Roti, Dal Makhni, Veg Biryani, Gulab Jamun'],['Poha, Jalebi','Kadhi Pakoda, Capsicum Aloo','Aloo/Kofta, Urad Dal, Veg Pepper Soup'],['Sweet Potato boiled, Sweet Chutney, Pudina Chutney, Boiled Chhole + Onion + Lemon + Chat Masala','Methi Aloo,Moong Dal,Friums,Fruits','Gajar Matar,Chana Dal,Fruit Custard'],['Onion Tomato Uttapam,Sambhar, Chutney','Black Chana Masala, Urad Dal, Masala Rice','Aloo Palak, Arhar Dal, Jeera Rice, Tomato Soup, Boondi Laddu'],['Aaloo Paratha, Pickle, Sauce ','Aaloo Gobi, Yellow Moong Dal, Chhachh','Paneer Butter Masala/Egg Curry(2 Eggs),Moong Dal, Plain Paratha, Gajar Halwa, Chana Salad']];
days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday','yesterday','today','tomorrow'] ;
d = new Date();
day_now = d.getDay();
day = 0;
meal = 0;
day_no=0;
slot_no=0;
intents.matches('Menu', '/Menu');

bot.dialog('/Menu',[
    function(session, args, next) {
        if(builder.EntityRecognizer.findEntity(args.entities,'builtin.datetimeV2.date')){
            day = (builder.EntityRecognizer.findEntity(args.entities,'builtin.datetimeV2.date')).entity.toLowerCase();            
        }
        if(builder.EntityRecognizer.findEntity(args.entities,'Places.MealType')){
            meal = (builder.EntityRecognizer.findEntity(args.entities,'Places.MealType')).entity.toLowerCase();        
        }
        session.beginDialog('days');
    },
])
.triggerAction({
    matches: /^menu$/i
});

bot.dialog('days',[
    function(session){
        if(day == days[7]){
            if(day_now==0){
                day = days[6];
            }
            else{
                day = days[day_now-1];
            }
        }
        else if(day == days[8]){
            day = days[day_now];
        }
        else if(day == days[9]){
            if(day_now==6){
                day = days[0];
            }
            else{
                day = days[day_now+1];
            }
        }
        session.beginDialog('check');    
    }
])
bot.dialog('check',[
    function(session){

        if(day && meal)
        {
            day_no=days.indexOf(day);
            slot_no=slot_mess.indexOf(meal);           
            session.send('Menu for %s %s is %s',days[day_no],slot_mess[slot_no],meals[day_no][slot_no]);
            day=0;
            meal=0;            
            session.endDialog();             
        } 
        else if( day && !meal)
        {        
            session.beginDialog('meal');
        }
        else if(!day && meal){
            session.beginDialog('day');
        }
        else{
            session.beginDialog('day');
        }
    },
    function(session,results){
        session.beginDialog('check');
    }
])

bot.dialog('day',[
    function(session){
        builder.Prompts.choice(session, "For which day you want?", "Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday", { listStyle: 3 });            
    },
    function(session,results){
        day = results.response.entity.toLowerCase();
        session.endDialog();
    }
])
bot.dialog('meal',[
    function(session){
        builder.Prompts.choice(session, "For which time you want?", "Breakfast|Lunch|Dinner", { listStyle: 3 });    
    },
    function(session,results){
        meal =results.response.entity.toLowerCase();
        session.endDialog();
    }
])


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

bus_day=0;
source=0;
destination=0;
slot_bus = ['weekdays','weekend'];
route = ['karwad','mbm'];
bus_no =[[['B1','B4','B3','B1 & B2','B3'],['B2 & B3','B1','B3','B4','B1']],[['B1','B4','B1 & B4','B2'],['B2','B4','B2','B1 & B4']]];
number_buses = [[[1,1,1,2,1],[2,1,1,1,1]],[[1,1,2,1],[1,1,1,2]]];
time = [[['0830','1200','1600','1745','1930'],['0820','1100','1800','1930','2030']],[['1000','1200','1430','1745'],['0930','1330','1600','2030']]];
                
intents.matches('BusSchedule','/BusSchedule');

bot.dialog('/BusSchedule',[
    function(session,args,next){
        if(builder.EntityRecognizer.findEntity(args.entities,'Events.Name')){
            bus_day = (builder.EntityRecognizer.findEntity(args.entities,'Events.Name')).entity.toLowerCase();
        } 
        if(builder.EntityRecognizer.findEntity(args.entities,'Places.PlaceName')){
            source = (builder.EntityRecognizer.findEntity(args.entities,'Places.PlaceName')).entity.toLowerCase();                      
        }
        if(builder.EntityRecognizer.findEntity(args.entities,'Places.DestinationPlaceName')){
            destination = (builder.EntityRecognizer.findEntity(args.entities,'Places.DestinationPlaceName')).entity.toLowerCase();                    
        }
        session.beginDialog('check_s_d');        
        },       
        function(session,results,next){
            if(source=='mbm'&&destination=='to mbm'){
                source=0;
            }
            else if(source==route[0] && destination==route[1]){
                source=0;                
            }else{
                source=1;
            }
            session.beginDialog('bus_final');
        }        
])
.triggerAction({
    matches: /^bus$|^bus from mbm to karwad$|^bus from karwad to mbm$/i
});


bot.dialog('check_s_d',[
    function(session,args,next){
        if(source && !destination){
            if (source == 'from karwad'){
                source= route[0];
                destination = route[1];
            }else{
                source = route[1];
                destination = route[0];
            }
            next();
        }
        if(!source && destination){
            if (destination== 'to karwad'){
                destination = route[0];
                source = route[1];
            }else{
                destination = route[1];
                source = route[0];                   
            }                
            next();
        }
        if(!source && !destination){
            session.beginDialog('check_route');                
        }          
        next();      
    },
    function(session,results){
        session.beginDialog('check_days');
    }
])

bot.dialog('check_route',[
    function(session){
        builder.Prompts.choice(session,'Please select a route','MBM to Karwad|Karwad to MBM',{listStyle:3});    
    },
    function(session,results){
        source = results.response.entity;
        if(source=='Mbm-Karwad'){
            source = 1;
            destination = 0;
            
        }else{
            source = 0;
            destination = 1;
        }
        session.endDialog();
    }
])

bot.dialog('check_days',[
    function(session){
        if(bus_day=='next'){
            if(day_now==days[0]||day_now==days[6]){                
                slot_no=1;   
            }
            else{
                slot_no=0;
            }
             session.beginDialog('present_time');
        }else{
            builder.Prompts.choice(session,'For which days do you want the schedule','Weekdays|Weekend', {listStyle:3});
        }                                
    },
    function(session,results){                
        if(results.response.entity){
            slot_no = slot_bus.indexOf(results.response.entity.toLowerCase());
            session.endDialog();                    
        }
    }
])

bot.dialog('bus_final',[
    function(session){
        for(i in time[slot_no][source]){    
            if(number_buses[slot_no][source][i]==2){
               session.send("%d Bus(es) depart at  %d with Bus No. %s",number_buses[slot_no][source][i],time[slot_no][source][i],bus_no[slot_no][source][i]);
            }
            else{
               session.send("%d Bus(es) depart at %d with Bus No. %s",number_buses[slot_no][source][i],time[slot_no][source][i],bus_no[slot_no][source][i]);
            }                 
        }
        source = 0
        destination = 0
        session.endDialog();
    }
])
      n=-1;
t=0;
hr=0;
mi=0;
x=0;
bot.dialog('present_time',[
    function(session,args,next){
 
        t = new Date();
        localTime=t.getTime();
        localOffset=t.getTimezoneOffset()*60000;
        utc = localTime+localOffset;
        offset = 5.5;
        india = utc + (3600000*offset);
        nd = new Date(india);
        fd = nd.toLocaleString();
        fd = String(nd);
        for(i in bus_no[slot_no][source]){
           
            hr = time[slot_no][source][i].substring(0, 2);      
            mi = time[slot_no][source][i].substring(2, 4);      
            x = new Date();
            x.setHours(hr,mi,0,0);
            x=String(x);
            if(fd<x){
                n=i;
            }
        }
        next();
    },
    function(session,results){
        if(n>=0){
            session.send("%d Bus(es) depart at  %d with Bus No. %s",number_buses[slot_no][source][n],time[slot_no][source][n],bus_no[slot_no][source][n]);
        }else{
            session.send("No bus is currently available");
        }
        slot_no=0;
        source=0;
        destination=0;
        bus_day=0;
        session.endDialog();
    }
])



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

intents.matches('Timetable','/Timetable')

bot.dialog('/Timetable', [
    function(session,args){
        cse = ['MA121 8:00 AM,<br/> EE121 9:00 AM,<br/> ME121 11:00 AM','MA121 8:00 AM,<br/> EE121 9:00 AM,<br/> ME122 10:00 AM,<br/> CS112 11:00 AM','MA121 8:00 AM,<br/> EE121 9:00 AM,<br/> ME121 11:00 AM','MA121 8:00 AM,<br/> EE121 9:00 AM,<br/> ME122 10:00 AM,<br/> CS112 11:00 AM','MA121 8:00 AM,<br/> ME122 9:00 AM,<br/> ME121 11:00 AM']
         ee = ['MA121 8:00 AM,<br/> EE121 9:00 AM,<br/> EE122 10:00 AM,<br/> ME 121 11:00 AM','MA121 8:00 AM,<br/> EE121 9:00 AM,<br/> ME122 10:00 AM','MA121 8:00 AM,<br/> EE121 9:00 AM,<br/> EE122 10:00 AM,<br/> ME 121 11:00 AM','MA121 8:00 AM,<br/> EE121 9:00 AM,<br/> ME122 10:00 AM','MA121 8:00 AM,<br/> ME122 9:00 AM,<br/> EE122 10:00 AM,<br/> ME 121 11:00 AM']
         me = ['MA121 8:00 AM,<br/> EE121 9:00 AM,<br/> ME123 10:00 AM,<br/> ME 121 11:00 AM','MA121 8:00 AM,<br/> EE121 9:00 AM,<br/> ME122 10:00 AM','MA121 8:00 AM,<br/> EE121 9:00 AM,<br/> EE122 10:00 AM,<br/> ME 121 11:00 AM','MA121 8:00 AM,<br/> EE121 9:00 AM,<br/> ME122 10:00 AM','MA121 8:00 AM,<br/> ME122 9:00 AM,<br/> EE122 10:00 AM,<br/> ME 121 11:00 AM'] 
    session.beginDialog('RePrompt');
    },
    function(session,results){
        roll = results.response.toLowerCase();
        builder.Prompts.choice(session, "For which day you want?", "Monday|Tuesday|Wednesday|Thursday|Friday", { listStyle: 3 });
    },
    function(session,results){
         days = ['monday','tuesday','wednesday','thursday','friday','yesterday','today','tomorrow'] ;
         var day_no = days.indexOf(results.response.entity.toLowerCase() );
        var branch=roll[3];
        var year=roll[2];
        if(year==7 && branch=="c")
        {
        session.send(cse[day_no]);
        
        }
           if(year==7 && branch=="m")
        {
        session.send(me[day_no]);
        }
           if(year==7 && branch=="e")
        {
         session.send(ee[day_no]);  
        }
        
    
    }
])
.triggerAction({
    matches: /^timetable$|^time table$/i
});


bot.dialog('RePrompt', [
    function (session, args) {
        if (args && args.reprompt) {
            builder.Prompts.text(session, "Enter the correct roll no  eg. B17CS001")
        } else {
            builder.Prompts.text(session, "Enter the roll no  eg. B17CS001");
        }
    },
    function (session, results) {
        //var matched = results.response.match(/\d+/g);
        //var number = matched ? matched.join('') : '';
        roll = results.response.toLowerCase();
        
        if (roll.length==8 && (roll[0]=='b'||'m') && (roll[3]=='c'||'e'||'m') && (roll[4]=='s'||'e'||'e') &&(roll[1]==1) &&( roll[5]==0)) {
            session.userData.phoneNumber = roll; // Save the number.
            session.endDialogWithResult({ response: roll });
        } else {
            // Repeat the dialog
            session.replaceDialog('RePrompt', { reprompt: true });
        }
    }
]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

faculty=[['CSE','Gaurav Harit','gharit'],['CSE','Anil Shukla','anilshukla'],['CSE','Aritra Banik','aritra'],['CSE','Chiranjoy Chattopadhyay','chiranjoy'],['CSE','Manas Khatua','manaskhatua'],['EE','Anil Kumar Tiwari','akt'],['EE','Aashish Mathur','aashishmathur'],['EE','Abdul Gafoor Shaik','saadgafoor'],['EE','Arun Kumar Singh','singhak'],['EE','Deepakkumar M. Fulwani','df'],['EE','Mahesh Kumar','mkumar'],['EE','Rajlaxmi Chouhan','rajlaxmichouhan'],['EE','Sandeep Kumar Yadav','sy'],['EE','Shree Prakash Tiwari','sptiwari'],['EE','Soumava Mukherjee','soumava'],['ME','B. Ravindra','ravib'],['ME','Anand Krishnan Plappally','anandk'],['ME','Barun Pratiher','barun'],['ME','Kaushal A. Desai','kadesai'],['ME','Laltu Chandra','chandra'],['ME','Prodyut Ranjan Chakraborty','pchakraborty'],['ME','Rahul Chibber','rahul_chibber'],['ME','Sudipto Mukhopadhyay','smukhopadhyay'],['ME','Suril Shah','surilshah'],['CY','Rakesh Kumar Sharma','rks'],['CY','Ananya Debnath','ananya'],['CY','Atul Kumar','atulk'],['CY','Manikandan Paranjothy','pmanikandan'],['CY','Nirmal Kumar Rana','nirmalrana'],['CY','Ramesh Metre','rkmetre'],['CY','Ritu Gupta','ritu'],['CY','Samanwita Pal','samnwita'],['CY','Sandip Murarka','sandipmurarka'],['MA','Kirankumar Hiremath','k.r.hiremath'],['MA','Gaurav Bhatnagar','goravb'],['MA','Puneet Sharma','puneet'],['MA','V.V.M.S. Chandramouli','chsarma'],['MA','Vivek Vijay','vivek'],['PH','Subhashish Banerjee','subhashish'],['PH','Ambesh Dixit','ambesh'],['PH','Ashutosh Kumar Alok','akalok'],['PH','Monika Sinha','ms'],['PH','Satyajit Sahu','satyajit'],['PH','Somnath Ghosh','somnathghosh'],['PH','V. Narayan','vnara'],['HSS','Vidya Sarveswaran','vs'],['HSS','Ankita Sharma','ankitasharma'],['HSS','K.J. George','kjg'],['HSS','Mayurakshi Chaudhuri','mchaudhari'],['HSS','V. Hari Narayan','hari']] ;
    
dept=0;

intents.matches('DeptInfo', '/DeptInfo');
    
bot.dialog('/DeptInfo',[
    function(session,args){
        if(builder.EntityRecognizer.findEntity(args.entities,'builtin.datetimeV2.date')){
            dept = (builder.EntityRecognizer.findEntity(args.entities,'builtin.datetimeV2.date')).entity.toLowerCase();
        }
        else{
            builder.Prompts.choice(session, "For which department do you want contact info?", "CSE|ME|EE|MA|PH", { listStyle: 3 });
        }        
    },
    function(session,results){
       // dept=['CSE','ME','EE','MA','PH']
       if(!(dept)){
            dept = results.response.entity; 
       } // session.send("%s",roll);
           for ( i in faculty)
           {
                if(faculty[i][0]==dept){
                    email=faculty[i][2]+"@iitj.ac.in"
                    homepage="home.iitj.ac.in/~"+faculty[i][2]+ "/"
                    session.send('Dept: %s <br/> Name: %s <br/> Homepage: %s <br/> Email: %s',faculty[i][0],faculty[i][1],homepage,email)
                }
           } 
           dept=0;
           session.endDialog();
    }       
])
.triggerAction({
    matches: /^faculty$|^faculty info$|^department info$/i
});


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Societies=['Technical','Aeromodelling Club,<br/> Astronomy Club,<br/> Automobile Club,<br/> Electronics Club,<br/> Programming Club,<br/> Robotics Club,<br/> Science Club',
'Cultural','Dance Club,<br/> Drama Club,<br/> Literature Club,<br/> Music Club,<br/> Quiz Club',
'Media Arts & Design','Animation Club,<br/> Fine Arts Club,<br/> Designing Club,<br/> Film Making and Video Editing Club,<br/> Photography and Photo Editing Club',
'Sports & Games','Athletics,<br/> Badminton,<br/> Cricket,<br/> Football,<br/> Volleyball,<br/> Lawn Tennis,<br/> Table Tennis,<br/> Weightlifting',
'A.R.M.A','Academic Grievances Cell,<br/> Management Cell,<br/> Public Speaking and Personality Development Cell,<br/> Research Promotion and Career Cell,<br/> ']

Fests=['Varchas','Varchas is the sports fest of IIT Jodhpur',
'Ignus','Ignus is the Socio-Techno-Cultural Fest of IIT Jodhpur',
'Spandan','Spandan is the intra college cultural fest of IIT Jodhpur',
'Nimble','Nimble is the Technical Fest of IIT Jodhpur']

Committees=['H.M.C.','Hostel Management Committee','M.M.C','Mess Management Committee','S.A.R.C','Students Alumni Relations Committee','S.R.C','Student Representative Committee','C.S','Counselling Service']

society=0;
fest=0;
committee=0;

intents.matches('Gymkhana','/Gymkhana')
bot.dialog('/Gymkhana',[
    function(session){
        builder.Prompts.choice(session,'Select From These Options','Societies|Fests|Committees',{listStyle:3});
    },
    function(session,results){
    	if(results.response.entity == 'Societies'){
    		session.beginDialog('Societies');
    	}
    	else if(results.response.entity == 'Fests'){
    		session.beginDialog('Fests');
    	}
    	else if(results.response.entity == 'Committees'){
    		session.beginDialog('Committees');
    	}
    }
])
.triggerAction({
    matches: /^gymkhana$|^society$|^societies$|^fests$|^committees$/i    
});

bot.dialog('Societies',[
	function(session){
		builder.Prompts.choice(session,'Select the Society','A.R.M.A|Cultural|Media Arts & Design|Sports & Games|Technical',{listStyle:3});	
	},
	function(session,results){
		society = results.response.entity;
		session.send("%s",Societies[Societies.indexOf(society)+1]);
		society=0;
		session.endDialog();
	}	
])

bot.dialog('Fests',[
	function(session){
		builder.Prompts.choice(session,'Select the Fest','Ignus|Spandan|Nimble|Varchas',{listStyle:3});	
	},
	function(session,results){
		fest = results.response.entity;
		session.send("%s",Fests[Fests.indexOf(fest)+1]);
		fest=0;
		session.endDialog();
	}	
])

bot.dialog('Committees',[
	function(session){
		builder.Prompts.choice(session,'Select the Committee','H.M.C|M.M.C|S.A.R.C|S.R.C|C.S',{listStyle:3});	
	},
	function(session,results){
		committee = results.response.entity;
		session.send("%s",Committees[Committees.indexOf(committee)+1]);
		committee=0;
		session.endDialog();
	}	
])

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
intents.matches('Developers','/Developers')

bot.dialog("/Developers",[
    function(session){
        session.send('Anshul Ahuja<br>        >   B17CS006<br/>Geetesh Gupta<br>       >  B17CS024<br/>Karan Modh<br>       >     B17CS029');
    }    
])     
.triggerAction({
    matches: /^developers$|^developer$/i    
});
        
              
    
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*intents.matches('help','/help');

bot.dialog('/help',[
    function(session,args,next) {
        builder.Prompts.choice(session, "What would you like to get (type 'exit' to get out of help)?", "Mess|Timetable|Bus Schedule|Faculty Info|Gymkhana|Developers|Exit",{listStyle:3});
    },
    function(session,results){
        if(results.response){
            if(results.response.entity === 'Exit'){
                session.endDialog("Thanks for using. You can chat again by saying Help");
            }
            else{
                switch(results.response.entity){
                    case "Mess":
                        session.beginDialog('/Menu');
                        break;
                    case "Timetable":
                        session.beginDialog('/Timetable');
                        break;
                    case "Bus Schedule":
                        session.beginDialog('/BusSchedule');
                        break;
                    case "Faculty Info":
                        session.beginDialog('/DeptInfo');
                        break;
                    case "Gymkhana":
                        session.beginDialog('/Gymkhana');
                        break;
                    case "Developers":
                        session.beginDialog('/Developers');
                        break;
                    
                }
            }
        }
        else{
            session.endDialog("Invalid Response. You can call again by saying Help");
        }
    },
    function (session, results) {
        // The menu runs a loop until the user chooses to (quit).
        session.replaceDialog('/help');
    }
])
.triggerAction({
    matches: /^help$|^Help$/i
});*/
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

intents.matches('Negative',(session)=>{
    session.send("Uh oh... Did Something go wrong? :/  <br/> Please send us feedback ");    
})
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
intents.matches('Affirmative', (session) => {
    okay = ['Okay! ','Alright! :)',"Roger That!"];
    session.send("%s", okay[Math.floor(Math.random() * (okay.length) )]);
})
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
intents.matches('Replies', [
    function(session,args,next){
        session.send("I am Humbled :D");
        session.send("Is there anything else I can help you with.");
    }
])
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
intents.matches('Lingo', (session) => {
    session.send('No I am not %s !  You are %s',session.message.text,session.message.text);
})

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
intents.matches('None', (session) => {
    session.send('Hey hey hey , you said \'%s\'.', session.message.text);
})
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
intents.matches('Greeting',[
    function (session)  {
        greetings=[' Hi,Nice to meet you! :)','Hello there! :)','Hi :)','Hello :)','Hi there! :)',"Hey :)"];
        session.send("%s", greetings[Math.floor(Math.random() * (greetings.length) )]);
         session.send("Hi I am IITJ Info Bot, I can help you with all your day to day campus info needs! <br/> Currently I support the following features: <br/> > Mess Menu <br/> > Bus Schedule<br/> > Student Timetable <br/> > Faculty Information <br/> > Gymkhana Details <br/> These features can be triggered with either names of these events or  generic commands. eg.\"what is the  menu for monday breakfast\" <br/> Type \"Hi\" to recall me for your help <br/> Type \"exit\"/ \"bye\" to exit current iteration ")
    } 
])
.triggerAction({
    matches: /^hi$|^hello$/i
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
intents.onDefault((session) => {
    session.send('Sorry, I did not understand \'%s\'.', session.message.text);
});



