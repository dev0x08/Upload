#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^MockRequestCompletion)(NSString *service, BOOL success, NSString *message);

@interface MockRequestService : NSObject
@property (nonatomic, copy, readonly) NSArray<NSString *> *serviceNames;
- (void)runTestForPhone:(NSString *)phone completion:(MockRequestCompletion)completion;
- (void)cancel;
@end

NS_ASSUME_NONNULL_END
