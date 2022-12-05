import { ApplicationError } from "@/protocols";

export function fullRoomError(): ApplicationError {
  return {
    name: "FullRoomError",
    message: "Room at full capacity",
  };
}
