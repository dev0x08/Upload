#import "MockRequestService.h"

@interface MockRequestService ()
@property (atomic, assign) BOOL cancelled;
@end

@implementation MockRequestService

- (instancetype)init {
    self = [super init];
    if (self) {
        _serviceNames = @[
            @"TV360", @"My Viettel", @"Sapo", @"Mocha", @"VieON",
            @"FPT Shop", @"Galaxy Play", @"30Shine", @"Cathay", @"Domino's",
            @"Batdongsan", @"Fahasa", @"Shopiness", @"Viettel Post", @"Bibabo",
            @"Owen", @"PNJ", @"F88", @"HeyU", @"The Coffee House",
            @"Điện Máy Xanh", @"KingFoodMart", @"GHN", @"Lotte Mart", @"VayVND",
            @"VATO", @"Nhà Thuốc Long Châu", @"Vinamilk", @"Shopee", @"Watsons",
            @"TokyoLife", @"Go2Joy"
        ];
    }
    return self;
}

- (void)runTestForPhone:(NSString *)phone completion:(MockRequestCompletion)completion {
    self.cancelled = NO;
    dispatch_queue_t q = dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0);
    [self.serviceNames enumerateObjectsUsingBlock:^(NSString *service, NSUInteger idx, BOOL *stop) {
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(idx * 0.12 * NSEC_PER_SEC)), q, ^{
            if (self.cancelled) return;
            BOOL ok = (idx % 7 != 0);
            NSString *msg = ok ? @"Mock request thành công" : @"Mock response: rate limited";
            if (completion) completion(service, ok, msg);
        });
    }];
}

- (void)cancel {
    self.cancelled = YES;
}

@end
