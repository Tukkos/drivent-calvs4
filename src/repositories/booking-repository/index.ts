import { prisma } from "@/config";

async function findBookingByUserId(userId: number) {
  return prisma.booking.findFirst({
    where: {
      userId: userId,
    },
    select: {
      id: true,
      Room: true,
    },
  });
}

async function postBooking(roomId: number, userId: number) {
  return prisma.booking.create({
    data: {
      userId: userId,
      roomId: roomId,
    },
  });
}

async function putBookingById(roomId: number, bookingId: number) {
  return prisma.booking.update({
    where: {
      id: bookingId,
    },
    data: {
      roomId: roomId,
    },
  });
}

const bookingRepository= {
  findBookingByUserId,
  postBooking,
  putBookingById,
};

export default bookingRepository;
