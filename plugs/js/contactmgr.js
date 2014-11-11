
//MODELS
var Templates = Backbone.Model.extend({
      defaults: {
        contactForm: '<div id="contactQuery"></div>'
      }
    }),
    ContactMgr = Backbone.Model.extend({ 
        initialize: function(){
          alert("Welcome to Contact Manager App");
        }
    }), //initialize cm app
    ContactList = Backbone.Model.extend({
      urlRoot: "/user",
      defaults: {
        fname: '',
        lname: '',
        email: '',
        phone: '',
        id: ''
      }
    });

//VIEW
var InitBody = Backbone.View.extend({
      el: $('body'),
      initialize: function(){
        _.bindAll(this, 'render');
        this.render();
      },
      render: function(){
        var temps = new Templates();
        $(this.el).append(_.template($('#contactMgrSkeleton').html()));
        $("#pageHeader > .containerMain").append(_.template($('#contactSearch').html()));
        $("#pageBody > .containerMain").append(temps.get('contactForm')); 
      },
      events: {
        'click #searchC' : 'searchContact'
      },
      searchContact: function(){
        $.ajax({
          url: '/search',
          type: 'get',
          data: $("#contactSearchForm").serialize(),
          success: function(data){
            console.log(data.length);
            $("#contactSList").remove();
            $("#pageBody > .containerMain").append(_.template($('#contactSearchList').html())); 
            var queried = data,
                len = data.length;
            for(var i=0;i<len;i++){
              var conDetails = {
                    fname: data[i].fname,
                    lname: data[i].lname,
                    email: data[i].email,
                    phone: data[i].phone,
                    id:    data[i].id
                  },
                  temps = _.template($('#contactLister').html());
             
              $('[name="slist"]').append(temps(conDetails));
              var ia = new InitContact();
            }
          }
        });
        return false; 
      }
    }),
    InitContact = Backbone.View.extend({
      initialize: function(){
        _.bindAll(this, 'render', 'initContactFunc');
        this.render();
        $dropdown();
        this.initContactFunc();
      },
      render: function(){
        var temps = _.template($("#contactForm").html());
        this.$el.html(temps);
      },
      events: {
        'click #addC' : 'addContact',
        'keyup' : 'checkInput',
        'input' : 'checkInput',
        'propertychange' : 'checkInput',
        'change' : 'checkInput'
      },
      checkInput: function(){
        if($('[name="fname"]').val().length>0 
            && $('[name="fname"]').val().length>0 
            && $('[name="email"]').val().length>0
            && this.isEmail($('[name="email"]').val())
            && $('[name="phone"]').val().length==11 
            && this.isPhone($('[name="phone"]').val())){
          $('#addC').removeAttr('disabled')
            .removeClass('uiButtonDisabled');
            return;
        }
        $('#addC').attr('disabled','disabled')
          .addClass('uiButtonDisabled');
      },
      isEmail: function(email){
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
      },
      isPhone: function(phone){
        return parseInt(phone) && phone.substring(0,1) == "0" && phone.substring(1,2) == "9";
      },
      capitalize: function(string){
          return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
      },
      initContactFunc: function(){
        var props;
        $('.remU').click(function(){
          props = $(this);
        })  
        $('.remU').graphModal({       
          type: 'prompt',
          theme:'light',
          title:'Delete Contact',
          content:'Are you sure? Once deleted, it cannot be undone.',
          buttons: ['Continue','Cancel'], 
          keyboard: true,
          func: function(){
            $.get(props.attr('href'), function(data){})
              .done(function(){
                props.closest('.clist-row').fadeOut(500);
              });
          }
        });
        $('.editU').graphModal({       
          type: 'external',
          theme:'light',
          width: 600,
          keyboard: true
        });
      },
      addContact: function(event){
        $("#addC")
          .attr('disabled','disabled')
          .addClass('uiButtonDisabled')
          .html('<i class="uiIcon-hl-time"></i> Adding up...');

        var data = JSON.parse(JSON.stringify($('#contactAddForm').serializeObject()));
          
        var con = new ContactList();
        con.set({
          fname: this.capitalize(data.fname),
          lname: this.capitalize(data.lname),
          email: data.email,
          phone: data.phone
        });
          
        $.ajax({
          url: "/user",
          type: "post",
          data: con.attributes,
          success: function(data){
            /*console.log("Latest entry is given below");
            console.log(data);*/

            con.set({id: data.id });
            var newContactList = new ContactView({
              model: con
            });
            newContactList.render();

            $("#addC")
              .removeAttr('disabled')
              .removeClass('uiButtonDisabled')
              .html('<i class="uiIcon-hl-ok"></i> Add Contact');
            $("#contactAddForm")[0].reset();
            }
        });
        return false;
      },
      removeContact: function(event){
        console.log('removeContact here');
        return false;
      }
    }),
    ContactView = Backbone.View.extend({
      tagName: 'div', 
      render: function(){
        var conDetails = {
              fname: this.capitalize(this.model.get('fname')),
              lname: this.capitalize(this.model.get('lname')),
              email: this.model.get('email'),
              phone: this.model.get('phone'),
              id:    this.model.get('id')
            },
            temps = _.template($('#contactLister').html());
           
        $('#clist').append(temps(conDetails));
        var ia = new InitContact();
      },
      capitalize: function(string){
          return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
      }
    });
$.fn.serializeObject = function()
  {
      var o = {};
      var a = this.serializeArray();
      $.each(a, function() {
          if (o[this.name] !== undefined) {
              if (!o[this.name].push) {
                  o[this.name] = [o[this.name]];
              }
              o[this.name].push(this.value || '');
          } else {
              o[this.name] = this.value || '';
          }
      });
      return o;
  };
$(document).ready(function(){
  var ib = new InitBody,          
      ac = new InitContact({el: $('#contactQuery')});

  $("#clist").append(_.template($('#contactLists').html()));
  var ia = new InitContact();
});