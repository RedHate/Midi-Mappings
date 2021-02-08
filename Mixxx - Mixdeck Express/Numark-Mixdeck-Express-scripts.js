// Numark Mixdeck Mapping Script Functions
//    RedHate

//borrowed functions nurmark mixtrack stripts.js

MixdeckExpress = new function() {
	
	this.decks = [];
	
};

MixdeckExpress.init = function(id) {

	MixdeckExpress.ManualLooping 	= [false, false];
	MixdeckExpress.TouchToggle 		= [false, false];
	MixdeckExpress.ScratchToggle 	= [false, false];
	MixdeckExpress.BrakeToggle 		= [false, false];
	MixdeckExpress.Scratching 		= [false, false];
	MixdeckExpress.SearchToggle 	= [false, false];

    //deck 1 leds
    //midi.sendShortMsg(0x90, 49, 1); //cue
    //midi.sendShortMsg(0x90, 51, 1); //play
    //midi.sendShortMsg(0x90, 52, 1); //loop in
    //midi.sendShortMsg(0x90, 53, 1); //loop out
    //midi.sendShortMsg(0x90, 54, 1); //reloop
    //midi.sendShortMsg(0x90, 55, 1); //reverse
    //midi.sendShortMsg(0x90, 56, 1); //brake
    //midi.sendShortMsg(0x90, 63, 1); //scratch
    //midi.sendShortMsg(0x90, 64, 1); //search
    
    //midi.sendShortMsg(0x90, 65, 1); //folder
    //midi.sendShortMsg(0x90, 66, 1); //track

	//-----------deck heads up display on mixdeck express unit most are useless----------
    //midi.sendShortMsg(0x90, 70, 1); //auto cue
    //midi.sendShortMsg(0x90, 71, 1); //elapsed
	//midi.sendShortMsg(0x90, 72, 1); //continue
	//midi.sendShortMsg(0x90, 73, 1); //total
	//midi.sendShortMsg(0x90, 74, 1); //remain
	//midi.sendShortMsg(0x90, 75, 1); //cue
	//midi.sendShortMsg(0x90, 76, 1); //pause
	//midi.sendShortMsg(0x90, 77, 1); //play
	//midi.sendShortMsg(0x90, 78, 1); //total track
	//midi.sendShortMsg(0x90, 80, 1); //auto
	//midi.sendShortMsg(0x90, 81, 1); //bpm
	//midi.sendShortMsg(0x90, 82, 1); //pitch
	//midi.sendShortMsg(0x90, 83, 1); //title
	//midi.sendShortMsg(0x90, 84, 1); //album
	//midi.sendShortMsg(0x90, 85, 1); //artist
	//midi.sendShortMsg(0x90, 86, 1); //prog
	//midi.sendShortMsg(0x90, 87, 1); //mt
	//midi.sendShortMsg(0x90, 88, 1); //reloop
	
	
	//0x21 		//trackknob
	//0x22 		//jogwheel
	//0x50 		//touch
	//0x37 		//loop in
	//0x36 		//loop out
	//0x35 		//reloop exit
	//0x3A		//pitch bend plus
	//0x3B		//pitch bend minus
	//0x3C		//pitch range
	//0x3D 		//play
	//0x3F 		//cue default
	//0x44 		//scratch
	//0x45 		//search
	//0x48 		//reverse
	//0x49		//prog
	//0x42		//mode (manualloop)
	//0x4A		//time
	//0x4B		//folder
	//0x4D 		//brake
	//0x4E		//track select knob press
	//0x4F 		//tap

};

MixdeckExpress.shutdown = function(id) {
	
   // turn off all LEDs
   for (var i = 1; i <= 127; i++) 
   {
		midi.sendShortMsg(0x90, i, 0);
		midi.sendShortMsg(0x91, i, 0);
   }

};

MixdeckExpress.grouptodeck = function(group) {

	var matches = group.match(/^\[Channel(\d+)\]$/);

	if (matches == null) return -1;
	else return matches[1];

}

MixdeckExpress.samplesperbeat = function(group) {
	
    // FIXME: Get correct channels for current deck
    var sampleRate = engine.getValue(group, "track_samplerate");
    var channels = 2;
    var bpm = engine.getValue(group, "file_bpm");
    var ret=channels * sampleRate * 60 / bpm;
    return channels * sampleRate * 60 / bpm;
    
}

MixdeckExpress.input = function(channel, control, value, status, group){
	
	var deck = MixdeckExpress.grouptodeck(group);
	
	if(value){
		
		if(control == 0x3A) //pitch bend plus
		{
			var bpm = engine.getValue(group, "file_bpm");
			engine.setValue(group, "rate_temp_up", bpm + 10);
		}
		if(control == 0x3B) //pitch bend minus
		{
			var bpm = engine.getValue(group, "file_bpm");
			engine.setValue(group, "rate_temp_down", bpm - 10);
		}

		if(control == 0x21) //trackknob
		{ 	
			if (value > 63)
			{
				value = value - 128;
			}

			engine.setValue(group, "SelectTrackKnob", value);
		}
		if(control == 0x22) //jogwheel
		{ 	
			var adjustedJog = parseFloat(value);
			var posNeg = 1;
			
			if (adjustedJog > 63) 
			{	// Counter-clockwise		
				adjustedJog = value - 128;
				posNeg = -1;
			}

			if (MixdeckExpress.Scratching[deck]) 
			{
				engine.scratchTick(deck, adjustedJog);
			}
			else 
			{

				var gammaInputRange 	= 23;	// Max jog speed
				var maxOutFraction 		= 0.8;	// Where on the curve it should peak; 0.5 is half-way
				var sensitivity 		= 1;	// Adjustment gamma
				var gammaOutputRange 	= 3;	// Max rate change
				
				if (engine.getValue(group,"play")) 
				{
					if (MixdeckExpress.SearchToggle[deck] == true) adjustedJog = gammaOutputRange * adjustedJog / (0.25 * maxOutFraction);
					else adjustedJog = posNeg * gammaOutputRange * Math.pow(Math.abs(adjustedJog) / (gammaInputRange * maxOutFraction), sensitivity);
				} 
				else 
				{
					if (MixdeckExpress.SearchToggle[deck] == true) adjustedJog = gammaOutputRange * adjustedJog / (0.25 * maxOutFraction);
					else adjustedJog = gammaOutputRange * adjustedJog / (gammaInputRange * maxOutFraction);
				}
				
				engine.setValue(group, "jog", adjustedJog);
			
			}
		}
		if(control == 0x50) //touch
		{ 	
			if(status >= 0x90) //if we are touching the platter (sent via touch trigger in midi.xml)
			{
				if(MixdeckExpress.ScratchToggle[deck])
				{
					engine.scratchEnable(deck, 512, 45, 0.2, (0.2)/32);
					MixdeckExpress.Scratching[deck] = true;
				}
			}
			else //otherwise we arent touching it (also sent via untouch trigger in midi.xml since there is no constant polling? dunno was a work around)
			{
				engine.scratchDisable(deck);
				MixdeckExpress.Scratching[deck] = false;
			}
		}
		if(control == 0x37) //loop in
		{ 	
			if(MixdeckExpress.ManualLooping[deck]) 
			{
				// Cut loop to Half
				var start = engine.getValue(group, "loop_start_position");
				var end = engine.getValue(group, "loop_end_position");
				if((start != -1) && (end != -1)) 
				{
					var len = (end - start) / 2;
					engine.setValue(group, "loop_end_position", start + len);
				}
			} 
			else 
			{
				if (engine.getValue(group, "loop_enabled")) 
				{
					engine.setValue(group, "reloop_exit", 1);
					midi.sendShortMsg(0x90+(deck-1), 54, 0); //loop in
					midi.sendShortMsg(0x90+(deck-1), 86, 0); //loop in hud
				}
				engine.setValue(group, "loop_in", 1);
				engine.setValue(group, "loop_end_position", -1);
				midi.sendShortMsg(0x90+(deck-1), 52, 1); //loop in
				midi.sendShortMsg(0x90+(deck-1), 86, 1); //loop in hud
				midi.sendShortMsg(0x90+(deck-1), 53, 0); //loop out
				midi.sendShortMsg(0x90+(deck-1), 87, 0); //loop in hud
			}
		}
		if(control == 0x36) //loop out
		{ 	
			var start = engine.getValue(group, "loop_start_position");
			var end = engine.getValue(group, "loop_end_position");

			if(MixdeckExpress.ManualLooping[deck])
			{
				// Set loop to current Bar
				var bar = MixdeckExpress.samplesperbeat(group);
				start = Math.ceil((engine.getValue(group, "playposition")*engine.getValue(group, "track_samples")/bar)-1)*bar;
				engine.setValue(group,"loop_start_position",start);
				engine.setValue(group,"loop_end_position", start + bar);
				engine.setValue(group, "reloop_exit",1);
				midi.sendShortMsg(0x90+(deck-1), 52, 1); //loop in
				midi.sendShortMsg(0x90+(deck-1), 86, 1); //loop in hud
				midi.sendShortMsg(0x90+(deck-1), 53, 1); //loop out
				midi.sendShortMsg(0x90+(deck-1), 87, 1); //loop in hud
			} 
			else 
			{
				if (start != -1)
				{
					if (end != -1)
					{
						// Loop In and Out set -> call Reloop/Exit
						engine.setValue(group, "reloop_exit", 1);
						midi.sendShortMsg(0x90+(deck-1), 52, 1); //loop in
						midi.sendShortMsg(0x90+(deck-1), 86, 1); //loop in hud
						midi.sendShortMsg(0x90+(deck-1), 53, 1); //loop out
						midi.sendShortMsg(0x90+(deck-1), 87, 1); //loop out hud
						midi.sendShortMsg(0x90+(deck-1), 54, 1); //reloop
						midi.sendShortMsg(0x90+(deck-1), 88, 1); //reloop hud
					} 
					else
					{
						// Loop In set -> call Loop Out
						engine.setValue(group, "loop_out", 1);
						midi.sendShortMsg(0x90+(deck-1), 53, 1); //loop out
						midi.sendShortMsg(0x90+(deck-1), 87, 1); //loop out hud
					}
				}
			}
		}
		if(control == 0x35) //reloop exit
		{ 	
			if(MixdeckExpress.ManualLooping[deck]) 
			{
					// Multiply Loop by Two
					var start = engine.getValue(group, "loop_start_position");
					var end = engine.getValue(group, "loop_end_position");
					if((start != -1) && (end != -1))
					{
						var len = (end - start) * 2;
						engine.setValue(group, "loop_end_position", start + len);
					}
			} 
			else 
			{
				if (engine.getValue(group, "loop_enabled")) 
				{
					midi.sendShortMsg(0x90+(deck-1), 54, 0); //reloop
					midi.sendShortMsg(0x90+(deck-1), 88, 0); //reloop hud
				} 
				else 
				{
					var start = engine.getValue(group, "loop_start_position");
					var end = engine.getValue(group, "loop_end_position");
					if( (start != -1) && (end != -1)) 
					{
						// Loop is set ! Light the led
						midi.sendShortMsg(0x90+(deck-1), 54, 1); //reloop
						midi.sendShortMsg(0x90+(deck-1), 88, 1); //reloop hud
					}
				}
				engine.setValue(group, "reloop_exit", 1);
			}
		}
		if(control == 0x3D) //play
		{ 	
			if(MixdeckExpress.BrakeToggle[deck]) //breaking stop mode
			{
				if (!engine.getValue(group,"play"))
				{
					engine.brake(deck,false); //unbreak the track
					engine.setValue(group, "play", 1); //play the track
					
				}
				else
				{
					engine.setValue(group, "play", 0); //stop the track
					engine.brake(deck,true); //brake the track
				}
			}
			else //regular stop mode
			{
				if (!engine.getValue(group,"play"))
				{
					engine.setValue(group, "play", 1); //play the track
				}
				else
				{
					engine.setValue(group, "play", 0); //stop the track
				}
			}
			
			//light up the LED
			if (engine.getValue(group,"play"))  //if the track is playing light up the led
			{
				midi.sendShortMsg(0x90+(deck-1), 51, 1); //play 
				midi.sendShortMsg(0x90+(deck-1), 77, 1); //play hud
				midi.sendShortMsg(0x90+(deck-1), 76, 0); //pause hud
			}
			else //otherwise shut it off...
			{
				midi.sendShortMsg(0x90+(deck-1), 51, 0); //play
				midi.sendShortMsg(0x90+(deck-1), 77, 0); //play hud
				midi.sendShortMsg(0x90+(deck-1), 76, 1); //pause hud
			}
		}
		if(control == 0x3F) //cue default
		{ 	
			if (!engine.getValue(group,"cue_default"))
			{
				engine.setValue(group, "cue_default", 1); //reset / play cue
				midi.sendShortMsg(0x90+(deck-1), 49, 1); //cue
				midi.sendShortMsg(0x90+(deck-1), 75, 1); //cue hud
				midi.sendShortMsg(0x90+(deck-1), 51, 0); //play
				midi.sendShortMsg(0x90+(deck-1), 77, 0); //play hud
				MixdeckExpress.BrakeToggle[deck] = false;
				midi.sendShortMsg(0x90+(deck-1), 56, 0); //brake
			}
			else 
			{
				engine.setValue(group, "cue_default", 0); //reset cue
				midi.sendShortMsg(0x90+(deck-1), 49, 0); //cue
				midi.sendShortMsg(0x90+(deck-1), 75, 0); //cue hud
				MixdeckExpress.BrakeToggle[deck] = false;
				midi.sendShortMsg(0x90+(deck-1), 56, 0); //brake
			}
		}
		if(control == 0x42) //manualloop
		{ 	
			if (MixdeckExpress.ManualLooping[deck]) 
			{
				MixdeckExpress.ManualLooping[deck] = false;
			} 
			else 
			{
				MixdeckExpress.ManualLooping[deck] = true;
			}
		}
		if(control == 0x44) //scratch
		{ 	
			if(!MixdeckExpress.ScratchToggle[deck])
			{
				MixdeckExpress.ScratchToggle[deck] = true;
				midi.sendShortMsg(0x90+(deck-1), 63, 1); //scratch
				MixdeckExpress.SearchToggle[deck] = false;
				midi.sendShortMsg(0x90+(deck-1), 64, 0); //search
			}
			else
			{
				MixdeckExpress.ScratchToggle[deck] = false;
				midi.sendShortMsg(0x90+(deck-1), 63, 0); //scratch
			}
		}
		if(control == 0x45) //search
		{ 	
			if(!MixdeckExpress.SearchToggle[deck])
			{
				MixdeckExpress.SearchToggle[deck] = true;
				midi.sendShortMsg(0x90+(deck-1), 64, 1); //search
				MixdeckExpress.ScratchToggle[deck] = false;
				midi.sendShortMsg(0x90+(deck-1), 63, 0); //scratch
			}
			else
			{
				MixdeckExpress.SearchToggle[deck] = false;
				midi.sendShortMsg(0x90+(deck-1), 64, 0); //search
			}
		}
		if(control == 0x48) //reverse
		{ 	
			if (!engine.getValue(group,"reverse"))
			{
				engine.setValue(group, "reverse", 1); //reverse on
				midi.sendShortMsg(0x90+(deck-1), 55, 1); //reverse
			}
			else
			{
				engine.setValue(group, "reverse", 0); //reverse off..
				midi.sendShortMsg(0x90+(deck-1), 55, 0); //reverse
			}
		}
		if(control == 0x4D) //brake
		{ 	
			if(!MixdeckExpress.BrakeToggle[deck])
			{
				MixdeckExpress.BrakeToggle[deck] = true;
				midi.sendShortMsg(0x90+(deck-1), 56, 1); //brake
			}
			else
			{
				MixdeckExpress.BrakeToggle[deck] = false;
				midi.sendShortMsg(0x90+(deck-1), 56, 0); //brake
			}
		}
		
	}
	
	return control;
	
}

