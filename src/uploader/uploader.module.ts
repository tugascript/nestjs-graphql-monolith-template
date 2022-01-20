import { Module } from '@nestjs/common';
import { UploaderService } from './uploader.service';

@Module({
  providers: [UploaderService]
})
export class UploaderModule {}
