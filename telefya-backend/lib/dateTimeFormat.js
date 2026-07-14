const  dateTimeFormat = (addToTime=0)=>{
const date = new Date(Date.now()+ (addToTime * 1000) );
const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
return formatted; 
}


module.exports  =  dateTimeFormat