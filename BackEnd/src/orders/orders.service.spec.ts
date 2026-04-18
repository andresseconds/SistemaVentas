import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { describe, it, beforeEach, expect } from '@jest/globals';

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersService],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an order', () => {
    expect(service.create).toBeDefined();
  });

  it('should find all orders', () => {
    expect(service.findAll).toBeDefined();
  });

  it('should find order by id', () => {
    expect(service.findOne).toBeDefined();
  });

  it('should update an order', () => {
    expect(service.update).toBeDefined();
  });

  it('should remove an order', () => {
    return expect(service.remove).toBeDefined();
  });
});

