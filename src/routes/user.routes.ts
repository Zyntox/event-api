import * as express from 'express';
import * as userController from '../controllers/user.controller';
import isAuthenticated from '../middleware/isAuthenticated';

function setUpUserRoutes(app){

  // Middleware
   app.use('/users', (req, res, next) => {
     isAuthenticated(req, res, next);
   })

  /**
  * @api {post} /user Create a new user profile
  * @apiName PostUser
  * @apiGroup User
  *
  * @apiParam {String} firstName First name of the user.
  * @apiParam {String} lastName Last name of the user.
  * @apiParam {String} phone Phonenumber of the user.
  * @apiParam {String} email The email of the user.
  */


  // Create a new user.
  app.post('/users', (req: express.Request, res: express.Response) => {
    userController.createUser(req, res).catch(error => {
      console.error("Error in createUser:", error);
      res.status(500).send({
        type: error.name,
        message: "Error while creating user."
      })
    });
  });



  /**
  * @api {get} /user Get all user-profiles
  * @apiName GetUser
  * @apiGroup User
  */

  // Retrieve all users.
  app.get('/users', (req: express.Request, res: express.Response) => {
    userController.getAllUsers(req, res).catch(error => {
      console.error("Error in getAllUsers:", error);
      res.status(500).send({
        type: error.name,
        message: "Error while fetching user"
      })
    });
  });



  /**
  * @api {post} /add-user-to-company Connect a user-profile with a company
  * @apiName AddUserToCompany
  * @apiGroup User
  */

  // Set up which company the user belongs to.
  app.post('/add-user-to-company', (req: express.Request, res: express.Response) => {
    userController.addCompanyToUser(req, res).catch(error => {
      console.error("Error in addCompanyToUser:", error);
      res.status(500).send({
        type: error.name,
        message: "Error while adding company to user"
      })
    });
  });



  /**
  * @api {get} /user/me Gets user-profile for currently authenticated user
  * @apiName GetCurrentUser
  * @apiGroup User
  * @apiSuccess {Number} id  Unique identifier for the user-profile.
  * @apiSuccess {Date} createdAt  Date for when the user-profile was created.
  * @apiSuccess {Date} updatedAt  Date for when the user-profile was last updated.
  * @apiSuccess {string} firstName  First name First name of the user.
  * @apiSuccess {string} lastName  Last name First name of the user.
  * @apiSuccess {string} phone  The users phone number.
  * @apiSuccess {string} email  The users email address.
  * @apiSuccess {Boolean} isActive  Checks if the user-profile has been activated.
  * @apiSuccess {Object} company  Company information.
  * @apiSuccess {Boolean} company.id  Unique identifier for the company.
  * @apiSuccess {Date} company.createdAt  Date for when the company info was created.
  * @apiSuccess {Date} company.updatedAt  Date for when the company info was last updated.
  * @apiSuccess {Date} company.title  The company title.
  * @apiSuccess {Array} events  List of events the user is participating in.
  * @apiSuccess {Object} events.event  Information about an event the user is participating in..
  * @apiSuccess {Number} events.event.id  Unique identifier for the event.
  * @apiSuccess {Number} events.event.title  The title of the event.
  * @apiSuccess {Number} events.event.description  The description of the event.
  * @apiSuccess {Array} activities  List of activites the user is participating in.
  * @apiSuccess {Object} activities.activity  Information about an activity the user is participating in.
  * @apiSuccess {Number} activities.activity.id  Unique identifier for the activity
  * @apiSuccess {Date} activities.activity.createdAt  Date for when the ativity info was created.
  * @apiSuccess {Date} activities.activity.updatedAt  Date for when the activity info was last updated.
  * @apiSuccess {String} activities.activity.title  The title of the activity.
  * @apiSuccess {String} activities.activity.description  The description of the activity.
  */

  // Retrieve information for a single logged in user.
  app.get('/users/me', (req: express.Request, res: express.Response) => {
    userController.getUserInfoForCurrentUser(req, res).catch(error => {
      console.error("Error in getUserInfoForCurrentUser:", error);
      res.status(500).send({
        type: error.name,
        message: "Error while fetching information for user"
      })
    });
  });



  /**
  * @api {get} /users/:userid Get a single user-profile by id.
  * @apiName GetSingleUSer
  * @apiGroup User
  *
  * @apiParam {Number} userId The unique id of the user.
  *
  * @apiSuccess {Number} id  Unique identifier for the user-profile.
  * @apiSuccess {Date} createdAt  Date for when the user-profile was created.
  * @apiSuccess {Date} updatedAt  Date for when the user-profile was last updated.
  * @apiSuccess {string} firstName  First name First name of the user.
  * @apiSuccess {string} lastName  Last name First name of the user.
  * @apiSuccess {string} phone  The users phone number.
  * @apiSuccess {string} email  The users email address.
  * @apiSuccess {Boolean} isActive  Checks if the user-profile has been activated.
  * @apiSuccess {Object} company  Company information.
  * @apiSuccess {Boolean} company.id  Unique identifier for the company.
  * @apiSuccess {Date} company.createdAt  Date for when the company info was created.
  * @apiSuccess {Date} company.updatedAt  Date for when the company info was last updated.
  * @apiSuccess {Date} company.title  The company title.
  * @apiSuccess {Array} events  List of events the user is participating in.
  * @apiSuccess {Object} events.event  Information about an event the user is participating in..
  * @apiSuccess {Number} events.event.id  Unique identifier for the event.
  * @apiSuccess {Number} events.event.title  The title of the event.
  * @apiSuccess {Number} events.event.description  The description of the event.
  * @apiSuccess {Array} activities  List of activites the user is participating in.
  * @apiSuccess {Object} activities.activity  Information about an activity the user is participating in.
  * @apiSuccess {Number} activities.activity.id  Unique identifier for the activity
  * @apiSuccess {Date} activities.activity.createdAt  Date for when the ativity info was created.
  * @apiSuccess {Date} activities.activity.updatedAt  Date for when the activity info was last updated.
  * @apiSuccess {String} activities.activity.title  The title of the activity.
  * @apiSuccess {String} activities.activity.description  The description of the activity.
  */

  // Retrieve a single user with userId
  app.get('/users/:userId', (req: express.Request, res: express.Response) => {
    userController.getUserById(req, res).catch(error => {
      console.error("Error in getUserById:", error);
      res.status(500).send({
        type: error.name,
        message: "Error while ferching user"
      })
    });
  });



  /**
  * @api {update} /users/:userid Update a single user-profile by id.
  * @apiName GetSingleUser
  * @apiGroup User
  *
  * @apiParam {Number} userId The unique id of the user.
  * 
  * @apiParam {String} firstName User first name
  * @apiParam {String} lastName User last name
  * @apiParam {String} email User email
  * @apiParam {String} phone User phone number
  * @apiParam {String} companyDepartment Department within the company user belongs to
  * @apiParam {String} aboutMe Description of user
  * @apiParam {String} allergiesOrPreferences User allergies or food preferences
  */

  // Update a user with userId
  app.put('/users/:userId', (req: express.Request, res: express.Response) => {
    userController.updateUser(req, res).catch(error => {
      console.error("Error in updateUser:", error);
      res.status(500).send({
        type: error.name,
        message: "Error while updating user"
      })
    });
  });



  /**
  * @api {delete} /users/:userid Delete a single user-profile by id.
  * @apiName DeleteSingleUser
  * @apiPermission ADMIN
  * @apiGroup User
  *
  * @apiParam {Number} userId The unique id of the user.
  */

  // FIXME: Needs to be locked down!
  // Delete a user with userId
  app.delete('/users/:userId', (req: express.Request, res: express.Response) => {
    userController.deleteUser(req, res).catch(error => {
      console.error("Error in deleteUser:", error);
      res.status(500).send({
        type: error.name,
        message: "Error while deleting user"
      })
    });
  });

  
  /**
  * @api {get} /event/activities/ Get all activities during the event for user 
  * @apiName GetUserEventActivities
  * @apiGroup User
  *
  * @apiParam {Number} eventId The unique identifier of the event.
  * @apiParam {Number} userId The id for the current user 
  */

  // Get all activities during given event
  app.get('/users/:userId/events/:eventId/activities', (req: express.Request, res: express.Response) => {
    userController.getUserEventActivities(req, res).catch(error => {
      console.error("Error in getUserEventActivities");
      res.status(500).send({
        type: error.name,
        message: "Error when fetching event activities for user"
      })
    });
  });
  
  /**
   * @api {get} /users/:userId/currentevent Get the current activity for user
   * @apiName GetCurrentEvent
   * @apiGroup User
   * 
   * @apiParam {Number} userId The unique identifier for the user. 
   */
  
   app.get('/users/:userId/currentevent', (req, res) => {
     userController.getCurrentEvent(req, res).catch(error => {
       console.error("Error in getCurrentEvent:", error);
       res.status(500).send({
         type: error.name,
         message: "Error when fetching current event for user"
       })
     })})


   /**
   * @api {get} /users/:userId/notifications Get all updates made for the user's activities. Define number of returned notifications with query param limit.
   * Default limit is 10.
   * @apiName GetActivityUpdateNotifications
   * @apiGroup User
   * 
   * @apiParam {Number} userId The unique identifier for the user. 
   */
  app.get('/users/:userId/notifications', (req, res) => {
    userController.getUpdateNotifications(req, res).catch(error => {
      console.error("Error in getUpdateNotifications:", error);
      res.status(500).send({
        type: error.name,
        message: "Error when fetching notifications"
      })
     })
    })
   
   /**
  * @api {put} /users/:userId/firstlogin First update when user log in for the first time
  * @apiDescription This route updates user informtaion and changes password when the user
  * logs in for the first time. Verification with token. 
  * @apiName FirstLogin
  * @apiGroup User
  * 
  * @apiParam {number} userId The unique identifier for the user
  * 
  * @apiParam {String} password The new password
  * @apiParam {String} firstName User first name
  * @apiParam {String} lastName User last name
  * @apiParam {String} email User email
  * @apiParam {String} phone User phone number
  * @apiParam {String} companyDepartment Department which the user belongs to
  */

  app.put('/users/:userId/firstlogin', (req, res) => {
    userController.firstUpdate(req, res).catch(error => {
      console.error("Error in firstUpdate:", error);
      res.status(500).send({
        type: error.name,
        message: "Error when updating user"
      })
    })
  });
  
/**
 * @api {post} /logout Logs out user.
 * @apiDescription Invalidates the refresh token.
 * @apiName Logout
 * @apiGroup User
 * @apiPermission Valid access token
 * 
 */
  app.post('/logout', isAuthenticated, (req, res) => {
    userController.logoutUser(req, res)
      .catch(error => {
        console.error("Error in logoutUser:", error)
        res.status(500).send({
          type: error.name, 
          message: "Could not log out user."})
    });
  })

  /**
 * @api {delete} /users/:userid/profileimage Deletes profile image for user.
 * @apiDescription Deletes the profile image for the user
 * @apiName Delete profileImage
 * @apiGroup User
 * @apiPermission Valid access token
 * 
 * @apiParam {number} userId The unique identifier for the user.
 */
  app.delete('/users/:userId/profileimage', (req, res) => {
    userController.deleteProfileImage(req, res).catch(error => {
      console.error("Error in deleteProfileImage:", error);
      res.status(500).send({
        type: error.name,
        message: "Could not delete profile image"
      })
    })
  })

  
  /**
   * @api {post} /users/:userId/playerId
   * @apiDescription Registers an OneSignal playerId for the user.
   * @apiName Add OneSignal playerId
   * @apiGroup User
   * @apiPermission Valid access token
   * 
   * @apiParam {string} playerId for the user.
   */
  app.post('/users/:userId/playerids', (req, res) => {
    userController.addPlayerId(req, res).catch(error => {
      console.error("Error in addPlayerId:", error);
      res.status(500).send({
        type: error.name,
        message: "Could not register user onesignal id"
      })
    })});
}


export default setUpUserRoutes;
