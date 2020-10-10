var express = require('express');
var router = express.Router();
const sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');
const RandExp = require('randexp');

const checkExistingCode = (shortcode) => {
  let fetchData=[];
  db.each('select shortcode form short_url where shortcode=?,',shortcode,(err,rows) =>{
  if(err)
    throw err
  fetchData=rows

  })
  if(fetchData.length > 0)
   return true

}

const shortenUrl = async (req,res) => {
  let {url,shortcode} = req.body
  let insertStatus=0
  if(!url || url === undefined || url === null)
  return  res.status(400).json({ ERROR: "URL is reuqired" });
  if(!shortcode || shortcode === undefined || shortcode === null)
    shortcode =  new RandExp(/^[0-9a-zA-Z_]{6}$/);
  if(!/^[0-9a-zA-Z_]{6}$/.test(shortcode))
    return  res.status(409).json({ ERROR: "URL already in use" }) 
  if(await checkExistingCode(shortcode))
    return 
  db.prepare("insert into short_url (url,shortcode,startDate,redirectCount) values (?,?,?,?)",url,shortcode, new Date(),0,(err,rows) => {
    if(err)
    throw err
    insertStatus=1
  })
  if(insertStatus)
  res.status(201).json({ shortcode: shortcode });
}

const updateRedirectCount = async (shortcode) => {
  if(shortcode != undefined || shortcode === ""){
    db.run('update short_url set redirectCount = redirecCount+1,lastSeenDate=? where shortcode=?',new Date(),shortcode,(err,rows) => {
      if(err)
        throw err

    })
  }
}
const getShortCode = async (req,res) => {
  let shortcode = req.params.shortcode
  let location=""
  db.each('select shortcode from short_url where shortcode=?,',shortcode,(err,rows) =>{
    if(err)
      throw err
    location = rows.url
  
    })
    if(location === "")
    return res.status(404).json({ ERROR: "URL not found" });
    await updateRedirectCount(shortcode)
    return res.status(302).json({ Location: location });
  
}

const getShortCodeStats = async (req,res) => {
  let shortcode = req.params.shortcode
  let startDate,lastSeenDate,redirectCount;
  db.each('select * from short_url where shortcode=?,',shortcode,(err,rows) =>{
    if(err)
      throw err
    startDate = rows.startDate
    lastSeenDate=rows.lastSeenDate
    redirectCount=rows.redirectCount
    if(rows.length < 0)
    return res.status(404).json({ ERROR: "URL not found" });
    })
    return res.status(302).json({ startDate: startDate,lastSeenDate:lastSeenDate,redirectCount:redirectCount });
  
}

router.post('/shorten', shortenUrl)
router.get('/:shortcode', getShortCode)
router.get('/:shortcode/stats', getShortCodeStats)
module.exports = router;
