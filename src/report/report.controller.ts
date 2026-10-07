import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import type { Request, Response } from 'express';

import { ReportService } from './report.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { AbilityGuard } from '../casl/ability/ability.guard';
import { CheckAbility } from '../casl/ability/ability.decorator';
import { ReportFilterDto } from './dto/report-filter.dto';

@Controller('report')
@UseGuards(JwtAuthGuard, AbilityGuard)
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
  ) {}

  @Get('vehicle/:vehicleId/export/csv')
  @CheckAbility('read', 'Report')
  async exportVehicleCsv(
    @Param('vehicleId') vehicleId: string,
    @Query() query: ReportFilterDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req.user as {
      enterpriseId: string;
    };

    const csv = await this.reportService.exportVehicleCsv(
      vehicleId,
      user.enterpriseId,
      query.from,
      query.to,
    );

    res.header('Content-Type', 'text/csv');
    res.attachment('vehicle-report.csv');
    res.send(csv);
  }

  @Get('enterprise/:enterpriseId/export/csv')
  @CheckAbility('read', 'Report')
  async exportEnterpriseCsv(
    @Param('enterpriseId') enterpriseId: string,
    @Query() query: ReportFilterDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req.user as {
      enterpriseId: string;
    };

    const csv =
      await this.reportService.exportEnterpriseCsv(
        enterpriseId,
        user.enterpriseId,
        query.from,
        query.to,
      );

    res.header('Content-Type', 'text/csv');
    res.attachment('enterprise-report.csv');
    res.send(csv);
  }

  @Get('vehicle/:vehicleId')
  @CheckAbility('read', 'Report')
  async getVehicleReport(
    @Param('vehicleId') vehicleId: string,
    @Req() req: Request,
    @Query() query: ReportFilterDto,
  ) {
    const user = req.user as {
      enterpriseId: string;
    };

    return this.reportService.getVehicleReport(
      vehicleId,
      user.enterpriseId,
      query.from,
      query.to,
    );
  }

  @Get('enterprise/:enterpriseId')
  @CheckAbility('read', 'Report')
  async getEnterpriseReport(
    @Param('enterpriseId') enterpriseId: string,
    @Req() req: Request,
    @Query() query: ReportFilterDto,
  ) {
    const user = req.user as {
      enterpriseId: string;
    };

    return this.reportService.getEnterpriseReport(
      enterpriseId,
      user.enterpriseId,
      query.from,
      query.to,
    );
  }

    @Get('dashboard/:enterpriseId')
  @CheckAbility('read', 'Report')
  async getDashboardReport(
    @Param('enterpriseId') enterpriseId: string,
    @Req() req: Request,
    @Query() query: ReportFilterDto,
  ) {
    const user = req.user as {
      enterpriseId: string;
    };

    return this.reportService.getDashboardReport(
      enterpriseId,
      user.enterpriseId,
      query.from,
      query.to,
    );
  }
}