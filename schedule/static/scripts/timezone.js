var _timeZoneOffset;

Date.setTimeZoneOffset = function(offset){
	if(offset.length == 5)
		offset = offset.substring(0,3) + ':' + offset.substring(3,5);
	
	_timeZoneOffset = offset;
}

Date.getTimeZoneOffset = function(){
	return _timeZoneOffset;
}

Date.prototype.toISOWithTimeZone = function(){
	return moment(this).format().substring(0,19) + _timeZoneOffset;
}



/*****************************************************
*自建TimeZoneDate类型
*****************************************************/
TimeZoneDate._UTCOffset = "+00:00";
TimeZoneDate._defaultOffset = "+08:00";
TimeZoneDate._publicOffset = "";

function TimeZoneDate(d){
	//设置时区信息

	this._timeZoneOffset = TimeZoneDate._publicOffset == "" 
							? TimeZoneDate._defaultOffset
							: TimeZoneDate._publicOffset;
							
	var needConvert = false;
	//获取不带时区的日期字符串
	if(d instanceof Date){
		d = moment(d).format();
		this._pureDate = d.substring(0,19);
		this._timeZoneOffset = TimeZoneDate._publicOffset == "" 
						? TimeZoneDate._defaultOffset
						: TimeZoneDate._publicOffset;
	
	}
	else if(d instanceof TimeZoneDate){
		this._pureDate = d._pureDate;
		this._timeZoneOffset = d._timeZoneOffset;
		d = d.toISOString();
		needConvert = true;
	}
	else{
		var len = d.length;
		if(len > 19){
			this._pureDate = d.substring(0,19);
			this._timeZoneOffset = TimeZoneDate.getTimeZoneFromISO(d);
			needConvert = true;
		}
		else if(len == 10){
			this._pureDate = d + "T00:00:00";
			this._timeZoneOffset = TimeZoneDate._publicOffset == "" 
				? TimeZoneDate._defaultOffset
				: TimeZoneDate._publicOffset; 
		}
		else if(len == 7){
			this._pureDate = d + "-01T00:00:00";
			this._timeZoneOffset = TimeZoneDate._publicOffset == "" 
				? TimeZoneDate._defaultOffset
				: TimeZoneDate._publicOffset; 
		}
		else{
			return null;
		}
	}
	if(needConvert){
		this.asTimeZone(TimeZoneDate._publicOffset);
	}
	
	return this;
}
TimeZoneDate.compare = function(d1,d2){
	if(typeof(d1) == 'string')
		d1 = new TimeZoneDate(d1);
	if(typeof(d2) == 'string')
		d2 = new TimeZoneDate(d2);
		
	d1 = d1.clone().asTimeZone(TimeZoneDate._UTCOffset);
	d2 = d2.clone().asTimeZone(TimeZoneDate._UTCOffset);
	
	if(d1.toString() < d2.toString()) return -1;
	else if(d1.toString() == d2.toString()) return 0;
	else if(d1.toString() > d2.toString()) return 1;
}
TimeZoneDate.today = function(){
	return new TimeZoneDate(Date.today());
}

TimeZoneDate.getTimeZoneFromISO = function(str){
	if(str[str.length-1]=='Z')
		return TimeZoneDate._UTCOffset;
	else{
		signIndex = str.indexOf('+',19) == -1 
						? str.indexOf('-',19)
						: str.indexOf('+',19);
		offset = str.substring(signIndex,signIndex + 6);
		return offset;
	}
}

TimeZoneDate.getUTCOffset = function(offset){
	hourCount = Number(offset.substring(1,3));
	minuteCount = Number(offset.substring(4));
	sign = offset[0];
	minutes = hourCount * 60 + minuteCount;
	return sign == "+" ? -minutes : minutes;
}

TimeZoneDate.prototype.in = function(early,late){
	if(TimeZoneDate.compare(early,this)>=0 && TimeZoneDate.compare(this,late)>=0)
		return true;
	return false;
}
TimeZoneDate.prototype.asTimeZone = function(newTimeZone){
	if(newTimeZone == this._timeZoneOffset){
	}	
	else{
		minutes = this.getUTCOffset() - TimeZoneDate.getUTCOffset(newTimeZone) ;
		this.addMinutes(minutes);
	}
	
	this._timeZoneOffset = newTimeZone;
	return this;
}

TimeZoneDate.dealWithOffset = function(offset){
	minutes = -tzDate.getUTCOffset();	//获得了与UTC的偏差分钟数
	tzDate.addMinutes(minutes);
}

TimeZoneDate.dayBetween = function(one,two){
	return (new TimeZoneDate(two).date() - new TimeZoneDate(one).date()) / 86400000;
}
TimeZoneDate.initTimeZoneOffset = function(offset){
	if(offset.length == 5)
		offset = offset.substring(0,3) + ':' + offset.substring(3,5);
		
	this._publicOffset = offset;
}

TimeZoneDate.prototype.getUTCOffset = function(){
	return TimeZoneDate.getUTCOffset(this._timeZoneOffset);
}

TimeZoneDate.prototype.getYear = function(){
	return this._pureDate.substring(0,4);
}

TimeZoneDate.prototype.getMonth = function(){
	return this._pureDate.substring(5,7);
}

TimeZoneDate.prototype.getDate = function(){
	return this._pureDate.substring(8,10);
}

TimeZoneDate.prototype.getHours = function(){
	return this._pureDate.substring(11,13);
}

TimeZoneDate.prototype.getMinutes = function(){
	return this._pureDate.substring(14,16);
}

TimeZoneDate.prototype.getSeconds = function(){
	return this._pureDate.substring(17);
}

TimeZoneDate.prototype.setYear = function(year){
	this._pureDate = year + this._pureDate.substring(4);
	return this;
}

TimeZoneDate.prototype.setMonth = function(month){
	month = (month + "").length == 2 ? month : ( "0" + month ); 
	this._pureDate =  this._pureDate.substring(0,5) + month + this._pureDate.substring(7);
	return this
}

TimeZoneDate.prototype.setDate = function(date){
	date = (date + "").length == 2 ? date : ("0" + date);
	this._pureDate =  this._pureDate.substring(0,8) + date + this._pureDate.substring(10);
	return this;
}

TimeZoneDate.prototype.setHours = function(hour){
	hour = (hour + "").length == 2 ? hour : ("0" + hour);

	this._pureDate =  this._pureDate.substring(0,11) + hour + this._pureDate.substring(13);
	return this;
}

TimeZoneDate.prototype.setMinutes = function(minute){
	minute = (minute + "").length == 2 ? minute : ( "0" + minute ); 
	this._pureDate =  this._pureDate.substring(0,14) + minute + this._pureDate.substring(16);
	return this
}

TimeZoneDate.prototype.setSeconds = function(second){
	second = (second + "").length == 2 ? second : ("0" + second);
	this._pureDate =  this._pureDate.substring(0,17) + second;
	return this;
}

TimeZoneDate.prototype.getDay = function(){
	return this.date().getDay();
}

TimeZoneDate.prototype.toISOString = function(){
	return this._pureDate + this._timeZoneOffset;
}

TimeZoneDate.prototype.toString = function(){
	return this.toISOString();
}

TimeZoneDate.prototype.clone = function(){
	return new TimeZoneDate(this.toString());
}

TimeZoneDate.prototype.addMonths = function(num){
	d = this.date();
	d.addMonths(num);
	this._pureDate = (new TimeZoneDate(d))._pureDate;
	return this;
}

TimeZoneDate.prototype.addDays = function(num){
	d = this.date();
	d.addDays(num);
	this._pureDate = (new TimeZoneDate(d))._pureDate;
	return this;
}

TimeZoneDate.prototype.addMinutes = function(num){
	d = this.date();
	d.addMinutes(num);
	this._pureDate = (new TimeZoneDate(d))._pureDate;
	return this;
}

TimeZoneDate.prototype.date = function(num){

	var valid = Date.validateDay(Number(this.getDate()),Number(this.getYear()),Number(this.getMonth())-1);
	if(valid != true) return null;
	
	d = new Date().clearTime();
	d.setFullYear(this.getYear());
	d.setMonth(this.getMonth() - 1);
	d.setDate(this.getDate());
	d.setHours(this.getHours());
	d.setMinutes(this.getMinutes());
	d.setSeconds(this.getSeconds());
	return d;
}

TimeZoneDate.prototype.getDateId = function(){
	return this._pureDate.substring(0,10);
}

TimeZoneDate.prototype.getMonthId = function(){
	return this._pureDate.substring(0,7);
}

TimeZoneDate.prototype.getTime = function(){
	return this._pureDate.substring(11,19);
}

TimeZoneDate.prototype.moveToFirstDayOfMonth = function(){
	this.setDate(1);
}

TimeZoneDate.prototype.clearTime = function(){
	this.setHours(0);
	this.setMinutes(0);
	this.setSeconds(0);
	return this;
}

TimeZoneDate.prototype.getDateString = function(){
	return this.toISOString().substring(0,10);
}
TimeZoneDate.prototype.getTimeString = function(){
	return this.toISOString().substring(11,16);
}

TimeZoneDate.prototype.moveToFirstDayOfMonth = function(){
	var d = this.date();
	d.moveToFirstDayOfMonth();
	this.setYear(d.getFullYear());
	this.setMonth(d.getMonth() + 1);
	this.setDate(d.getDate());
	return this;
}

TimeZoneDate.prototype.moveToLastDayOfMonth = function(){
	var d = this.date();
	d.addMonths(1);
	d.moveToFirstDayOfMonth();
	d.addDays(-1);
	
	this.setYear(d.getFullYear());
	this.setMonth(d.getMonth() + 1);
	this.setDate(d.getDate());
	return this;
}
TimeZoneDate.prototype.moveToDate = function(date){
	this.setDate(date.getDate());
	this.setMonth(Number(date.getMonth()) + 1);
	this.setYear(date.getFullYear());
	return this;
}

TimeZoneDate.prototype.setTime = function(str){
	var hour = "00";
	var minute = "00";
	var second = "00";
	if(str.indexOf(':') != -1){
		var strArray = str.split(":");
		if(strArray.length > 0) hour = strArray[0];
		if(strArray.length > 1) minute = strArray[1];
		if(strArray.length > 2) second = strArray[2];
	}else{
		if(str.length >= 2) hour = str.substring(0,2);
		if(str.length >= 4) hour = str.substring(2,4);
		if(str.length >= 6) hour = str.substring(4,6);
	}
	
	this.setHours(hour);
	this.setMinutes(minute);
	this.setSeconds(second);
	
	return this;
}

TimeZoneDate.prototype.between = function(d1,d2){
	var result1 = TimeZoneDate.compare(d1,this);
	var result2 = TimeZoneDate.compare(this,d2);
	if(result1<=0 && result2<=0)
		return true;
	return false;
}

TimeZoneDate.prototype.validate = function(){
	return Date.validateDay(Number(this.getDate()),Number(this.getYear()),Number(this.getMonth())-1);
}

TimeZoneDate.prototype.getWeekOfMonth = function(){
	var firstDay = this.date().clone().moveToFirstDayOfMonth();
	var weekBegin = firstDay.getWeekOfYear();
	var weekEnd = this.date().getWeekOfYear();
	
	return weekEnd-weekBegin+1;
}

TimeZoneDate.prototype.moveToWeekdayOfMonth = function(day,week){
	if(isUndefined(week)) week = 1;
	var d = this.date();
	d.moveToFirstDayOfMonth();
	if(week == 1 && d.getDay() == day) 
		this.moveToDate(d);
	else{
		while(week >= 1){
			d.moveToDayOfWeek(day);
			week -= 1;
		}
		this.moveToDate(d);
	}
	return this;
}

TimeZoneDate.prototype.toTimeString = function(){
	return this.getHours() + ":" + this.getMinutes();
}

TimeZoneDate.prototype.isBefore = function(date){
	if(TimeZoneDate.compare(this,date) <0 ) return true;
	return false;
}

TimeZoneDate.prototype.isAfter = function(date){
	if(TimeZoneDate.compare(this,date) >0 ) return true;
	return false;
}

TimeZoneDate.weekBetween = function(one,two){
	var days = TimeZoneDate.dayBetween(one,two);
	return Math.floor(days / 7);
}