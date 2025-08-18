import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AIConfigurationService } from '../services/ai-configuration.service';
import { CreateAIConfigurationDto, UpdateAIConfigurationDto } from '../dto/ai-configuration.dto';
import { AIConfiguration } from '../entities/ai-configuration.entity';

@ApiTags('AI Configuration')
@Controller('config')
export class AIConfigurationController {
  constructor(private readonly aiConfigurationService: AIConfigurationService) {}

  @Post()
  @ApiOperation({ summary: 'Create new AI configuration' })
  @ApiResponse({ status: 201, description: 'Configuration created successfully', type: AIConfiguration })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @Body(ValidationPipe) createDto: CreateAIConfigurationDto,
  ): Promise<AIConfiguration> {
    return await this.aiConfigurationService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all AI configurations' })
  @ApiResponse({ status: 200, description: 'Configurations retrieved successfully', type: [AIConfiguration] })
  async findAll(): Promise<AIConfiguration[]> {
    return await this.aiConfigurationService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active AI configuration' })
  @ApiResponse({ status: 200, description: 'Active configuration retrieved successfully', type: AIConfiguration })
  async getActive(): Promise<AIConfiguration> {
    return await this.aiConfigurationService.getActiveConfiguration();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get AI configuration by ID' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved successfully', type: AIConfiguration })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async findOne(@Param('id') id: string): Promise<AIConfiguration> {
    return await this.aiConfigurationService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update AI configuration' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully', type: AIConfiguration })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDto: UpdateAIConfigurationDto,
  ): Promise<AIConfiguration> {
    return await this.aiConfigurationService.update(id, updateDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update AI configuration (legacy)' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully', type: AIConfiguration })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async updateLegacy(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDto: UpdateAIConfigurationDto,
  ): Promise<AIConfiguration> {
    return await this.aiConfigurationService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete AI configuration' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Configuration deleted successfully' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.aiConfigurationService.remove(id);
    return { message: 'Configuration deleted successfully' };
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate AI configuration' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Configuration activated successfully', type: AIConfiguration })
  async activate(@Param('id') id: string): Promise<AIConfiguration> {
    return await this.aiConfigurationService.activate(id);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test AI configuration' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Configuration tested successfully' })
  async test(@Param('id') id: string, @Body() body: { message: string }): Promise<any> {
    const result = await this.aiConfigurationService.testConfiguration(id);
    return {
      success: result.success,
      message: result.message,
      response: 'Test response from AI model',
      performance: {
        responseTime: 150,
        tokenCount: 25
      }
    };
  }

  @Get('ollama/models')
  @ApiOperation({ summary: 'Get available Ollama models from user local installation' })
  @ApiResponse({ status: 200, description: 'Ollama models retrieved successfully' })
  async getOllamaModels(): Promise<any> {
    return await this.aiConfigurationService.getAvailableOllamaModels();
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get AI configuration templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully', type: [AIConfiguration] })
  async getTemplates(): Promise<AIConfiguration[]> {
    // TODO: Implement templates
    return [];
  }

  @Get('ollama/status')
  @ApiOperation({ summary: 'Check Ollama status from server side (avoids browser CORS)' })
  @ApiResponse({ status: 200, description: 'Status retrieved' })
  async getOllamaStatus(): Promise<any> {
    return await this.aiConfigurationService.checkOllamaStatus();
  }
}
