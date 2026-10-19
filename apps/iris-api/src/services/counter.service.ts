import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Counter, CounterDocument } from '../schemas';

@Injectable()
export class CounterService {
  constructor(
    @InjectModel(Counter.name) private readonly counterModel: Model<CounterDocument>,
  ) {}

  async getNextCode(modelName: string, tenantId?: Types.ObjectId | null): Promise<number> {
    const filter: Record<string, unknown> = {
      model: modelName,
      field: 'code',
      tenant: tenantId || null,
    };

    const updated = await this.counterModel
      .findOneAndUpdate(
        filter,
        { $inc: { count: 1 } },
        { new: true, upsert: true },
      )
      .exec();

    return updated.count;
  }
}
