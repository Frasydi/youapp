import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IsEnum, IsDate, IsString, IsNumber, IsNotEmpty, IsUrl } from 'class-validator';

export type ProfileDocument = HydratedDocument<Profile>;

export enum Gender {
    M = "Male",
    F = "Female"
}

export enum Horoscope {
    Aries = "Aries",
    Taurus = "Taurus",
    Gemini = "Gemini",
    Cancer = "Cancer",
    Leo = "Leo",
    Virgo = "Virgo",
    Libra = "Libra",
    Scorpio = "Scorpio",
    Sagittarius = "Sagittarius",
    Capricorn = "Capricorn",
    Aquarius = "Aquarius",
    Pisces = "Pisces"
}

export enum Zodiac {
    Rat = "Rat",
    Ox = "Ox",
    Tiger = "Tiger",
    Rabbit = "Rabbit",
    Dragon = "Dragon",
    Snake = "Snake",
    Horse = "Horse",
    Goat = "Goat",
    Monkey = "Monkey",
    Rooster = "Rooster",
    Dog = "Dog",
    Pig = "Pig"
}

@Schema()
export class Profile {
  @Prop()
  @IsString()
  @IsNotEmpty()
  display_name: string;

  @Prop({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @Prop({ type: Date })
  @IsDate()
  birthday: Date;

  @Prop({ enum: Horoscope })
  @IsEnum(Horoscope)
  horoscope: Horoscope;

  @Prop({ enum: Zodiac })
  @IsEnum(Zodiac)
  zodiac: Zodiac;

  @Prop()
  @IsNumber()
  height: number;

  @Prop()
  @IsNumber()
  weight: number;

  @Prop()
  @IsUrl()
  image_url: string;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);

// Helper functions to determine horoscope and zodiac
function getHoroscope(date: Date): Horoscope {
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return Horoscope.Aquarius;
  if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return Horoscope.Pisces;
  if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return Horoscope.Aries;
  if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return Horoscope.Taurus;
  if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return Horoscope.Gemini;
  if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return Horoscope.Cancer;
  if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return Horoscope.Leo;
  if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return Horoscope.Virgo;
  if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return Horoscope.Libra;
  if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return Horoscope.Scorpio;
  if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return Horoscope.Sagittarius;
  if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return Horoscope.Capricorn;
}

function getZodiac(year: number): Zodiac {
  const zodiacs = [
    Zodiac.Rat, Zodiac.Ox, Zodiac.Tiger, Zodiac.Rabbit, Zodiac.Dragon, Zodiac.Snake,
    Zodiac.Horse, Zodiac.Goat, Zodiac.Monkey, Zodiac.Rooster, Zodiac.Dog, Zodiac.Pig
  ];
  return zodiacs[year % 12];
}

// Pre-save hook to set horoscope and zodiac based on birthday
ProfileSchema.pre('save', function (next) {
  const Profile = this as ProfileDocument;
  if ((Profile.isModified('birthday') || Profile.isNew) && Profile.birthday != null) {
    Profile.horoscope = getHoroscope(Profile.birthday);
    Profile.zodiac = getZodiac(Profile.birthday.getUTCFullYear());
  }
  next();
});
