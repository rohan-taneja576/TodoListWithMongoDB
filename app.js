const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect(
  'mongodb+srv://admin-rohan:rohan123@cluster0.qom7r.mongodb.net/todolistDB',
  {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  }
);

const itemSchema = {
  name: String,
};
const Item = mongoose.model('Item', itemSchema);

const item1 = new Item({
  name: 'Item one',
});
const item2 = new Item({
  name: 'Item two',
});
const item3 = new Item({
  name: 'Item three',
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema],
};
const List = mongoose.model('List', listSchema);

app.get('/', (req, res) => {
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, err => {
        if (err) {
          console.log(err);
        } else {
          console.log('Successfully inserted default items in DB');
        }
      });
      res.redirect('/');
    } else {
      res.render('list', { listTitle: 'Today', newListItems: foundItems });
    }
  });
});

app.get('/:customListName', (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect('/' + customListName);
      } else {
        res.render('list', {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post('/', (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });
  if (listName == 'Today') {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);
    });
  }
});

app.post('/delete', (req, res) => {
  const checkedID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName == 'Today') {
    Item.findByIdAndRemove(checkedID, err => {
      if (!err) {
        console.log('Deleted item successfully');
        res.redirect('/');
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedID } } },
      (err, foundList) => {
        if (!err) {
          res.redirect('/' + listName);
        }
      }
    );
  }
});

// app.get('/work', (req, res) => {
//   res.render('list', { listTitle: 'Work List', newListItems: workItems });
// });

let port = process.env.PORT;
if(port == null || port == ""){
  port= 3000;
}

app.listen(port, () => {
  console.log('server Started on Port 3000');
});
