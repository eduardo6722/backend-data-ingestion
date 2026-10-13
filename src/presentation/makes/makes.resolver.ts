import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { GetMakesUseCase } from '../../domain/makes/use-cases/list-makes';
import { Make as MakeObjectType } from './models/make.model';

@Resolver(() => MakeObjectType)
export class MakesResolver {
  constructor(private readonly getMakesUseCase: GetMakesUseCase) {}

  @Query(() => [MakeObjectType])
  async getMakes(
    @Args('skip', { type: () => Int, defaultValue: 0 }) skip: number,
    @Args('take', { type: () => Int, defaultValue: 10 }) take: number,
  ) {
    const page = await this.getMakesUseCase.execute({ skip, take });

    return (
      page?.items.map((make) => ({
        makeId: make.makeId,
        makeName: make.makeName,
        vehicleTypes: make.vehicleTypes.map((vehicleType) => ({
          typeId: vehicleType.typeId,
          typeName: vehicleType.typeName,
        })),
      })) ?? []
    );
  }
}
