import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MakeVehicleType {
  @Field()
  typeId: string;

  @Field()
  typeName: string;
}

@ObjectType()
export class Make {
  @Field()
  makeId: string;

  @Field()
  makeName: string;

  @Field(() => [MakeVehicleType])
  vehicleTypes: MakeVehicleType[];
}
