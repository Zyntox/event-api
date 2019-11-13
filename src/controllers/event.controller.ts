import {getRepository, Equal, createQueryBuilder} from "typeorm";
import Event from '../entities/event.entity';
import Company from '../entities/company.entity';
import User from '../entities/user.entity';
import Activity from '../entities/activity.entity';

import {validateEvent} from '../modules/validation';
import { getStorage, uploadFile, removeFile, getDataUrl, resizeAndCompress, ImageType, removeAllFiles, compressAndResize, handleMulterError } from "../modules/fileHelpers";
import { trimInput, getPagingResponseMessage, getSortingParams } from "../modules/helpers";

const storage = getStorage("public/original", "eventImage");

export async function createEvent(req, res) {
  
  uploadFile(storage, req, res, async (err) => {

    if (err) {
      console.error("Error from multer: ", err)
      const errorMessage = handleMulterError(err);
      return res.status(400).send(errorMessage)
    }

    let company = await getRepository(Company).findOne({ id: req.body.companyId });
  
    if(!company){
      if (req.file) {
        removeFile(req.file.path);
      }
      return res.status(404).send({
        message: 'No company was found with the provided company id.',
      });
    }
    
    const input = trimInput(req.body);
    const [inputValid, errorMessage, errorDetails] = validateEvent(input);
  
    if (!inputValid) {
      if (req.file) {
        removeFile(req.file.path)
      }
      res.status(400).send({
        message: errorMessage,
        details: errorDetails})
      return;
    }
  
    const event = new Event();
    event.title = input.title;
    event.description = input.description === "null"? null: input.description;
    event.company = company;
    event.startTime = input.startTime;
    event.endTime = input.endTime;
    event.location = input.location;
    event.goodToKnow = input.goodToKnow === "null"? null: input.goodToKnow;

    const {pathToSave, newFilePaths, compressionDone} = await compressAndResize(req.file, 50)
    
    if (req.file) {
      removeFile(req.file.path); // Remove the original file to only save the compressed.
    }

    if (pathToSave) {
      event.coverImageUrl = pathToSave;
    }

    if (compressionDone) {
      getRepository(Event).save(event)
      .then(event => {
        return res.status(201).send(event);
      })
      .catch(error => {
        removeAllFiles(newFilePaths);
        return res.status(500).send({
          type: error.name,
          message: "Error while creating event. Event not created."});
      })
    }
  })
}

export async function getEventById(req, res) {
  const eventId = req.params.eventId;
  getRepository(Event)
    .findOne({id: eventId})
    .then(event => {
      event.coverImageUrl = getDataUrl(event.coverImageUrl, ImageType.COMPRESSED);
      res.status(200).send(event)
    }).catch(error => {
      console.error("Error while fetching event: ", error)
      res.status(500).send({
        type: error.name,
        message: "Could not fetch event"})
    })
}

export async function updateEvent(req, res){
  const event = await getRepository(Event).findOne({id: req.params.eventId });

  if (!event) {
    return res.status(400).send({message: "Specified event does not exit."})
  }

  uploadFile(storage, req, res, async (err) => {

    if (err) {
      console.error("Error from multer: ", err)
      const errorMessage = handleMulterError(err);
      return res.status(400).send(errorMessage)
    }

    const input = trimInput(req.body);
    const [inputValid, errorMessage, errorDetails] = validateEvent(input);
  
    if (!inputValid) {
      if (req.file) {
        removeFile(req.file.path);
      }
      res.status(400).send({
        message: errorMessage,
        details: errorDetails})
      return;
    }
    event.title = input.title;
    event.description = input.description === "null"? null: input.description;
    event.startTime = input.startTime;
    event.endTime = input.endTime;
    event.location = input.location;
    event.goodToKnow = input.goodToKnow === "null"? null: input.goodToKnow;
    
    let oldFilePath;
    if (event.coverImageUrl) {
      oldFilePath = event.coverImageUrl.split(":")[1];
    } else {
      oldFilePath = null;
    }

    const {pathToSave, newFilePaths, compressionDone} = await compressAndResize(req.file, 50)
    
    if (req.file) {
      removeFile(req.file.path); // Remove the original file to only save the compressed.
    }

    if (pathToSave) {
      event.coverImageUrl = pathToSave;
    }
    if (compressionDone) {
      getRepository(Event).save(event)
      .then(response => {
        if (req.file && oldFilePath) {
            removeAllFiles([oldFilePath, oldFilePath.replace(ImageType.COMPRESSED, ImageType.MINIATURE)]);
        }
        return res.status(200).send(response)
      })
      .catch(error => {
        if (req.file) {
          removeAllFiles(newFilePaths);
        }
        console.error("Error while updating event:", error);
        return res.status(500).send({
          type: error.name,
          message: `Could not update event ${event.id}.`,
        })
      })
    } else {
      return res.status(400).send({message: "Could not upload image."})
    }
  })
}

export async function getAllEvents(req, res){
  getRepository(Event).find({relations: ['participants', 'activities', 'company'], order: {id: "ASC"}})
  .then(events => {
    // const eventsWithImages = events.map(event => {
    //   event.coverImageUrl = getDataUrl(event.coverImageUrl);
    //   return event;
    // })
    return res.status(200).send(events);
  })
  .catch(error => {
    console.error("Error while fetching events:", error)
    return res.status(500).send({message:"Could not fetch events."});
  })
}

export async function getEventParticipants(req, res) {
  // get all users on specified event

  const sortableColumns = ["id", "firstName", "lastName", "companyDepartment"];
  const sortableOrder = ["ASC", "DESC"];
  const [column, order] = getSortingParams(req);

  if (!sortableColumns.includes(column) || !sortableOrder.includes(order.toUpperCase())){
    return res.status(400).send(
      {message: `Specified column or order to sort by is wrong.`});
  }
  
  createQueryBuilder(User)
    .innerJoin("User.events", "ue", "ue.id=:eventId", {eventId: req.params.eventId})
    .orderBy(`User.${column}`, order.toUpperCase())
    .getMany()
    .then(
      users => {
        // const usersWithImages = users.map(user => {
        //   user.profileImageUrl = getDataUrl(user.profileImageUrl);
        //   return user;
        // })
        return res.status(200).send(users)},
      error => {
        console.error("Error while fetching event participants: "+error); 
        return res.status(500).send({
          type: error.name,
          message: "Could not fetch event participants"})
      }
    )
}

export async function getEventParticipantsV1(req, res) {
    // get all users on specified event

    const sortableColumns = ["id", "firstName", "lastName", "companyDepartment"];
    const sortableOrder = ["ASC", "DESC"];
    
    const pageLimit = req.query.limit? parseInt(req.query.limit): 20;
    const pageOffset = req.query.offset? parseInt(req.query.offset): 0;
    const reqPath = req.url;
    
    const [column, order] = getSortingParams(req);

    if (!sortableColumns.includes(column) || !sortableOrder.includes(order.toUpperCase())){
      return res.status(400).send(
        {message: `Specified column or order to sort by is wrong.`});
    }
    
    // Not optimal to fetch this seperately.
    const totalRecords = await createQueryBuilder(User)
      .innerJoin("User.events", "ue", "ue.id=:eventId", {eventId: req.params.eventId})
      .getCount();
  
    createQueryBuilder(User)
      .innerJoin("User.events", "ue", "ue.id=:eventId", {eventId: req.params.eventId})
      .offset(pageOffset)
      .limit(pageLimit)
      .orderBy(`User.${column}`, order.toUpperCase())
      .getMany()
      .then(
        users => {
          const usersWithImages = users.map(user => {
            user.profileImageUrl = getDataUrl(user.profileImageUrl);
            return user;
            })
          const responseMessage = getPagingResponseMessage(usersWithImages, totalRecords, pageOffset, pageLimit, reqPath);
          return res.status(200).send(responseMessage)}, 
        error => {
          console.error("Error while fetching event participants: "+error); 
          return res.status(500).send({
            type: error.name,
            message: "Could not fetch event participants"})
        }
      )
}

export async function getEventParticipant(req, res) {
  createQueryBuilder(User)
  .innerJoin("User.events", "ue")
  .where("ue.id = :eventId", { eventId: req.params.eventId})
  .andWhere("User.id = :userId",   { userId: req.params.userId })
  .getOne()
  .then(user => {
    user.profileImageUrl = getDataUrl(user.profileImageUrl, ImageType.COMPRESSED);
    return res.status(200).send(user);
  })
  .catch(error => {
    console.error("Error while fetching event participants:", error)
    return res.status(500).send({ 
      type: error.name,
      message:'Error while fetching user.' });
  })
};

export async function getEventActivities(req, res) {
  createQueryBuilder(Activity)
  .where("Activity.event =:eventId", {eventId: req.params.eventId})
  .orderBy("Activity.id", "ASC")
  .getMany()
  .then(activities => {
    // const activitiesWithImage = activities.map(activity => {
    //   activity.coverImageUrl = getDataUrl(activity.coverImageUrl);
    //   return activity;
    // })
    res.status(200).send(activities)},
    error => {
      console.error("Error while trying to fetch event activities: "+error);
      return res.status(500).send({message: "Could not fetch event activities"})}
  )
  .catch(error => {
    console.error("Error while trying to fetch event activities: "+error);
    return res.status(500).send({message: "Error while fetching event activities"})
  })
}

export async function addUserToEvent(req, res){
  const user = await getRepository(User).findOne({id: req.body.userId }, {relations: ['company']});
  const event = await getRepository(Event).findOne({ id: req.body.eventId }, {relations: ['participants', 'company']});

  if (!event) {
    return res.status(404).send({message: "No event exists for the provided id."})
  }

  if(!user){
    return res.status(404).send({
      message: 'No user exists for the provided id.',
    })
  }

  if(!user.company){
    return res.status(400).send({
      message: 'User is not associated to any company.',
    })
  }

  // Check if the user is from the same company.
  if(user.company.id !== event.company.id){
    return res.status(400).send({
      message: 'The user is not assigned to the same company as the event!',
    })
  }

  event.participants.push(user);

  await getRepository(Event).save(event)
  .then(response => {
    res.status(200).send({
      message: `${user.firstName} ${user.lastName} successfully added to the event ${event.title}!`,
    })
  })
  .catch(error => {
    console.error("Error while adding user to event:", error)
    res.status(500).send({
      type: error.name,
      message: `Could not add the user ${user.firstName} ${user.lastName} to the event ${event.title}.`,
    })
  })
}

export async function deleteEvent(req, res){

  let event = await getRepository(Event).findOne({id: req.params.eventId }, {relations: ['activities']});

  if(!event){
    return res.status(404).send({
      message: 'No event found for the provided id.',
    })
  }

  let coverImage;
  if (event.coverImageUrl) {
    coverImage = event.coverImageUrl.split(":")[1];
  } else {
    coverImage = null;
  }

  // Try to remove the activities first.
  getRepository(Activity).remove(event.activities)
  .then(response => {
    event.activities.map(activity => {
      removeAllFiles([activity.coverImageUrl, activity.coverImageUrl.replace(ImageType.COMPRESSED, ImageType.MINIATURE)])});
      getRepository(Event).remove(event)
      .then(response2 => {
        removeAllFiles([coverImage, coverImage.replace(ImageType.COMPRESSED, ImageType.MINIATURE)]);
        return res.status(204).send();
      })
      .catch(error2 => {
        console.error("Error while removing event: ", error2);
        return res.status(500).send({
          message: "Could not remove event."
        })
      })
  })
  .catch(error => {
    console.error("Error while removing an event:", error);
    return res.status(500).send({
      type: error.type,
      message: "Error while removing event",
    })
  })
};

export async function removeUserFromEvent(req, res){
  const user = await getRepository(User).findOne({id: req.body.userId }, {relations: ['events', 'activities']});
  const event = await getRepository(Event).findOne({ id: req.body.eventId }, {relations: ['participants', 'activities']});

  // ...Check if the user was empty.
  if(!user){
    return res.status(404).send({
      message: 'No user could be found with that id.',
    })
  }

  // ...Check if the event was empty.
  if(!event){
    return res.status(404).send({
      message: 'Could not find any event with that id.',
    })
  }

  // Check if the user is a participant of the event.
  if(!event.participants.find(participant => participant.id === user.id)){
    return res.status(400).send({
      message: 'The user is not a participant of the event.',
    });
  }

  // finds index of the event and removes it from the user.
  user.events.splice(user.events.indexOf(event), 1);

  // Finds all related activites and removes the user from them.
  user.activities = user.activities.filter(activity => {
    event.activities.forEach(eventActivity => {
      if (activity.id === eventActivity.id){
        return;
      } else {
        return activity;
      }
    })
  })

  getRepository(User).save(user)
  .then(response => {
    return res.status(204).send();
  })
  .catch(error => {
    console.error("Error while removing user from event:", error);
    res.status(500).send({
      message: `Could not remove ${user.firstName} ${user.lastName} from the event ${event.title}.`,
    })
  })
}

export async function deleteCoverImage(req, res) {
  const eventId = req.params.eventId;

  const event = await getRepository(Event).findOne({id: eventId});

  if (!event) {
    res.status(400).send({message: "No event with the provided id"})
  }

  if (event.coverImageUrl){
    const filePath = event.coverImageUrl.split(":")[1];
    event.coverImageUrl = null;
    getRepository(Event).save(event).then(event => {
      removeAllFiles([filePath, filePath.replace(ImageType.COMPRESSED, ImageType.MINIATURE)])
      return res.status(204).send();
    }).catch(error => {
      console.error("Error while saving event with no image: ", error)
      return res.status(500).send({
        type: error.name,
        message: "Error while trying to remove cover image"
      })
    })
    } else {
      res.status(204).send();
    }
}


