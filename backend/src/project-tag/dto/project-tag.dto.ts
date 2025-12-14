import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

@InputType()
export class CreateProjectTagInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  tag: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  projectId: number;
}

@InputType()
export class UpdateProjectTagInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tag?: string;
}
