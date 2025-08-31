import type { Image } from "wasp/entities";
import { HttpError } from "wasp/server";
// import type { GetTasks } from "wasp/server/operations";

// type CreateTaskPayload = Pick<Image, "description">
// type UpdateTaskPayload = Pick<Image, "id" | "isDone">

// export const getTasks: GetTasks<void, Image[]> = async (args, context) => {
// 	if(!context.user){
// 		throw new HttpError(401)
// 	}
// 	return context.entities.Image.findMany({
// 		where: { users: { id: context.user.id } },
// 		orderBy: { id: "asc" }
// 	})
// }

// export const createTask: CreateTask<CreateTaskPayload, Image> = async (args, context) => {
// 	if(!context.user){
// 		throw new HttpError(401)
// 	}
// 	return context.entities.Image.create({
// 		data: { 
// 			description: args.description,
// 			users: { connect: { id: context.user.id } } 
// 		}
// 	})
// }

// export const updateTask: UpdateTask<UpdateTaskPayload, Image> = async (args, context) => {
// 	if(!context.user){
// 		throw new HttpError(401)
// 	}
// 	return context.entities.Image.update({
// 		where: { 
// 			id: args.id, users: { id: context.user.id }},
// 		data: {
// 			isDone: args.isDone
// 		}
// 	})
// }