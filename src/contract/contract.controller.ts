import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { ContractService } from './contract.service';

import {
  CreateContractDto,
  UpdateContractDto,
} from './dto/contract.dto';

import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { AbilityGuard } from '../casl/ability/ability.guard';
import { CheckAbility } from '../casl/ability/ability.decorator';

@Controller('contract')
@UseGuards(JwtAuthGuard, AbilityGuard)
export class ContractController {
  constructor(
    private readonly contractService: ContractService,
  ) {}

  // Create a contract
  @CheckAbility('create', 'Contract')
  @Post()
  create(
    @Body() dto: CreateContractDto,
    @Req() req: any,
  ) {
    return this.contractService.create(
      dto,
      req.user.id,
    );
  }

  // Upload Terms and Conditions PDF
  @CheckAbility('update', 'Contract')
  @Post(':id/terms-file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/contracts',
        filename: (req, file, callback) => {
          const uniqueName =
            `${Date.now()}-${Math.round(Math.random() * 1e9)}` +
            extname(file.originalname).toLowerCase();

          callback(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (req, file, callback) => {
        if (
          file.mimetype !== 'application/pdf' ||
          extname(file.originalname).toLowerCase() !== '.pdf'
        ) {
          return callback(
            new BadRequestException(
              'Only PDF files are allowed.',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  @CheckAbility('update', 'Contract')
  @Post(':id/terms-file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/contracts',
        filename: (req, file, callback) => {
          const uniqueName =
            `${Date.now()}-${Math.round(Math.random() * 1e9)}` +
            extname(file.originalname).toLowerCase();

          callback(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (req, file, callback) => {
        if (
          file.mimetype !== 'application/pdf' ||
          extname(file.originalname).toLowerCase() !== '.pdf'
        ) {
          return callback(
            new BadRequestException('Only PDF files are allowed.'),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  uploadTermsFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Please upload a PDF file.');
    }

    return this.contractService.updateTermsFile(
      id,
      `uploads/contracts/${file.filename}`,
      req.user.id,
    );
  }

  // Get all contracts
  @CheckAbility('read', 'Contract')
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.contractService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      sortBy || 'startDate',
      sortOrder || 'desc',
    );
  }

  // Get expiring contracts
  @CheckAbility('read', 'Contract')
  @Get('expiring')
  findExpiring(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.contractService.findExpiring(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      sortBy || 'endDate',
      sortOrder || 'asc',
    );
  }

  // Get one contract
  @CheckAbility('read', 'Contract')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractService.findOne(id);
  }

  // Update a contract
  @CheckAbility('update', 'Contract')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateContractDto,
    @Req() req: any,
  ) {
    return this.contractService.update(
      id,
      dto,
      req.user.id,
    );
  }

  // Delete a contract
  @CheckAbility('delete', 'Contract')
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.contractService.remove(
      id,
      req.user.id,
    );
  }
}
